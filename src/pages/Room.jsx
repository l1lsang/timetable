import { useState, useEffect, useMemo } from "react";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import Timetable from "../Timetable";

/* =========================
   기본 상수
========================= */
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
   🏷️ TOP3 표시용 포맷
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
     🧑‍🤝‍🧑 전체 유저 선택 (Firestore)
  ========================= */
  const [allSelections, setAllSelections] = useState([]);

  /* =========================
     🔄 Firestore 실시간 구독
     - 다른 사람 선택
     - 내 선택 복구
  ========================= */
  useEffect(() => {
    if (!roomId || !userId) return;

    const ref = collection(db, "rooms", roomId, "selections");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list = [];

      snapshot.forEach((doc) => {
        list.push({
          userId: doc.id,
          slots: doc.data().slots || [],
        });
      });

      setAllSelections(list);

      // 🔥 내 선택 복구
      const mine = list.find((d) => d.userId === userId);
      if (mine) {
        setMySelection(new Set(mine.slots));
      }
    });

    return () => unsubscribe();
  }, [roomId, userId]);

  /* =========================
     💾 내 선택 저장
     (Timetable에서 드래그 종료 시 1회 호출)
  ========================= */
  const handleSaveSelection = async (set) => {
    setMySelection(set);

    await setDoc(
      doc(db, "rooms", roomId, "selections", userId),
      {
        slots: Array.from(set),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  };

  /* =========================
     📊 히트맵 계산
     🔥 Firestore 데이터만 기준
========================= */
  const heatmap = useMemo(() => {
    const map = {};

    allSelections.forEach(({ slots }) => {
      slots.forEach((key) => {
        map[key] = (map[key] || 0) + 1;
      });
    });

    return map;
  }, [allSelections]);

  /* =========================
     🔥 TOP 3
  ========================= */
  const top3 = useMemo(() => {
    return Object.entries(heatmap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [heatmap]);

  return (
    <div className="page">
      <div className="content">
        {/* =========================
            📅 시간표
        ========================= */}
        <Timetable
          heatmap={heatmap}
          onChange={handleSaveSelection}
        />

        {/* =========================
            🏆 사이드 패널
        ========================= */}
        <div className="side-panel">
          <h3>🔥 가장 많이 겹치는 시간</h3>

          {top3.length === 0 && (
            <p>아직 선택된 시간이 없어요</p>
          )}

          {top3.map(([key, count], index) => (
            <p key={key}>
              {index + 1}. {formatSlot(key, count)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
