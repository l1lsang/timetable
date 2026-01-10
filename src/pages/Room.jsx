import { useState, useEffect, useMemo } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import Timetable from "../Timetable";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const START_HOUR = 9;

/* =========================
   ⏰ slotIndex → 시간 문자열
========================= */
function slotIndexToTime(slotIndex) {
  const totalMinutes = START_HOUR * 60 + slotIndex * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

/* =========================
   🏷️ TOP3 포맷
========================= */
function formatSlot(key, count) {
  const [dayIndex, slotIndex] = key.split("-").map(Number);
  const start = slotIndexToTime(slotIndex);
  const end = slotIndexToTime(slotIndex + 1);

  return `${DAYS[dayIndex]} ${start} ~ ${end} (${count}명)`;
}

export default function Room() {
  const roomId = localStorage.getItem("roomId");
  const userId = localStorage.getItem("userId");

  /* =========================
     🧍 내 선택
  ========================= */
  const [mySelection, setMySelection] = useState(new Set());

  /* =========================
     👥 모든 멤버 선택
  ========================= */
  const [membersSelections, setMembersSelections] = useState([]);

  /* =========================
     💾 저장 상태
  ========================= */
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved

  /* =========================
     🔄 실시간 멤버 선택 구독
     + 내 선택 복구
  ========================= */
  useEffect(() => {
    if (!roomId) return;

    const q = collection(db, "rooms", roomId, "members");

    const unsub = onSnapshot(q, (snap) => {
      const list = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (Array.isArray(data.selection)) {
          list.push(new Set(data.selection));
        }

        // 🔥 내 선택 복구
        if (docSnap.id === userId && data.selection) {
          setMySelection(new Set(data.selection));
        }
      });

      setMembersSelections(list);
    });

    return () => unsub();
  }, [roomId, userId]);

  /* =========================
     📊 히트맵 계산
  ========================= */
  const heatmap = useMemo(() => {
    const map = {};

    membersSelections.forEach((set) => {
      set.forEach((key) => {
        map[key] = (map[key] || 0) + 1;
      });
    });

    return map;
  }, [membersSelections]);

  /* =========================
     🔥 TOP3
  ========================= */
  const top3 = useMemo(() => {
    return Object.entries(heatmap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [heatmap]);

  /* =========================
     💾 Firestore 저장 (드래그 종료 시)
  ========================= */
  const saveSelection = async (selectionSet) => {
    if (!roomId || !userId) return;

    setSaveState("saving");

    await setDoc(
      doc(db, "rooms", roomId, "members", userId),
      {
        selection: Array.from(selectionSet),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setSaveState("saved");

    setTimeout(() => setSaveState("idle"), 1500);
  };

  return (
    <div className="page">
      <div className="content">
        {/* 📅 시간표 */}
        <Timetable
          heatmap={heatmap}
          onChange={(set) => {
            setMySelection(set);
            saveSelection(set);
          }}
        />

        {/* 🏆 사이드 패널 */}
        <div className="side-panel">
          <h3>🔥 가장 많이 겹치는 시간</h3>

          {top3.length === 0 && (
            <p>아직 선택된 시간이 없어요</p>
          )}

          {top3.map(([key, count], i) => (
            <p key={key}>
              {i + 1}. {formatSlot(key, count)}
            </p>
          ))}

          {/* 💾 저장 상태 */}
          <div style={{ marginTop: 16, fontSize: 13 }}>
            {saveState === "saving" && "💾 저장 중…"}
            {saveState === "saved" && "✅ 저장됨"}
          </div>
        </div>
      </div>
    </div>
  );
}
