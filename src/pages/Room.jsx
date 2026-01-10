import { useState, useMemo } from "react";
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
  const [mySelection, setMySelection] = useState(new Set());

  /* =========================
     🧑‍🤝‍🧑 더미 데이터 (나 + 다른 사람들)
     → 나중에 Firestore 데이터로 교체
  ========================= */
  const allSelections = [
    new Set(["2-6", "2-7", "4-10"]),
    new Set(["2-6", "4-10"]),
    mySelection,
  ];

  /* =========================
     📊 히트맵 계산
  ========================= */
  const heatmap = useMemo(() => {
    const map = {};
    allSelections.forEach((set) => {
      set.forEach((k) => {
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
        {/* 시간표 */}
        <Timetable
          heatmap={heatmap}
          onChange={setMySelection}
        />

        {/* 사이드 패널 */}
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
        </div>
      </div>
    </div>
  );
}
