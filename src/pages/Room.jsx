import { useState, useEffect, useMemo } from "react";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Timetable from "../Timetable";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const START_HOUR = 9;

/* ⏰ slotIndex → 시간 문자열 */
function slotIndexToTime(slotIndex) {
  const totalMinutes = START_HOUR * 60 + slotIndex * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function formatSlot(key, count) {
  const [dayIndex, slotIndex] = key.split("-").map(Number);
  return `${DAYS[dayIndex]} ${slotIndexToTime(slotIndex)} ~ ${slotIndexToTime(slotIndex + 1)} (${count}명)`;
}

export default function Room() {
  const roomId = localStorage.getItem("roomId");
  const userId = localStorage.getItem("userId");

  /* 🧍 내 선택 */
  const [mySelection, setMySelection] = useState(new Set());

  /* 🧑‍🤝‍🧑 전체 선택 (Firestore) */
  const [allSelections, setAllSelections] = useState([]);

  /* =========================
     🔄 Firestore 구독
  ========================= */
  useEffect(() => {
    if (!roomId) return;

    const ref = collection(db, "rooms", roomId, "selections");

    const unsub = onSnapshot(ref, (snap) => {
      const list = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, slots: doc.data().slots || [] });
      });
      setAllSelections(list);

      // 🔥 내 선택 복구
      const mine = list.find((d) => d.id === userId);
      if (mine) {
        setMySelection(new Set(mine.slots));
      }
    });

    return () => unsub();
  }, [roomId, userId]);

  /* =========================
     💾 내 선택 저장 (드래그 끝)
  ========================= */
  const saveMySelection = async (set) => {
    setMySelection(set);

    await setDoc(
      doc(db, "rooms", roomId, "selections", userId),
      { slots: Array.from(set) },
      { merge: true }
    );
  };

  /* =========================
     📊 히트맵 (🔥 Firestore 기준)
  ========================= */
  const heatmap = useMemo(() => {
    const map = {};
    allSelections.forEach(({ slots }) => {
      slots.forEach((k) => {
        map[k] = (map[k] || 0) + 1;
      });
    });
    return map;
  }, [allSelections]);

  /* =========================
     🔥 TOP3
  ========================= */
  const top3 = useMemo(() => {
    return Object.entries(heatmap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [heatmap]);

  return (
    <div className="page">
      <div className="content">
        <Timetable heatmap={heatmap} onChange={saveMySelection} />

        <div className="side-panel">
          <h3>🔥 가장 많이 겹치는 시간</h3>

          {top3.length === 0 && <p>아직 선택된 시간이 없어요</p>}

          {top3.map(([key, count], i) => (
            <p key={key}>
              {i + 1}. {formatSlot(key, count)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
