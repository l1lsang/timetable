import { useState, useEffect, useMemo, Fragment } from "react";
import "./timetable.css";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const START_HOUR = 9;
const END_HOUR = 24;
const SLOT_PER_HOUR = 2; // 30분

/**
 * props
 * - heatmap: { "day-slot": number }
 * - onChange: (Set) => void
 */
export default function Timetable({ heatmap = {}, onChange }) {
  const [dragging, setDragging] = useState(false);
  const [mySelected, setMySelected] = useState(new Set());

  /* =========================
     🧠 셀 토글 (중복 토글 방지)
  ========================= */
  const toggle = (key) => {
    setMySelected((prev) => {
      if (prev.has(key)) return prev; // 🔥 드래그 중 중복 방지
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  /* =========================
     🖱️ 마우스 드래그
  ========================= */
  const handleMouseDown = (key) => {
    setDragging(true);
    toggle(key);
  };

  const handleMouseEnter = (key) => {
    if (dragging) toggle(key);
  };

  const handleEnd = () => {
    setDragging(false);
  };

  /* =========================
     📱 모바일 터치 드래그 (핵심)
  ========================= */
  const handleTouchMove = (e) => {
    if (!dragging) return;

    const touch = e.touches[0];
    const el = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );

    if (!el) return;
    if (!el.classList.contains("cell")) return;

    const key = el.dataset.key;
    if (key) toggle(key);
  };

  /* =========================
     🔄 선택 변경 시 부모에게 전달
  ========================= */
  useEffect(() => {
    if (onChange) {
      onChange(mySelected);
    }
  }, [mySelected, onChange]);

  /* =========================
     ⏰ 시간 슬롯 생성
  ========================= */
  const slots = useMemo(() => {
    const result = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      for (let s = 0; s < SLOT_PER_HOUR; s++) {
        result.push(`${h}:${s === 0 ? "00" : "30"}`);
      }
    }
    return result;
  }, []);

  return (
    <div
      className="timetable-wrapper"
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
      onTouchMove={handleTouchMove}
    >
      <div className="timetable">
        {/* 요일 헤더 */}
        <div className="header empty" />
        {DAYS.map((day) => (
          <div key={day} className="header">
            {day}
          </div>
        ))}

        {/* 시간표 본문 */}
        {slots.map((time, slotIndex) => (
          <Fragment key={slotIndex}>
            {/* 시간 */}
            <div className="time">{time}</div>

            {/* 요일별 셀 */}
            {DAYS.map((_, dayIndex) => {
              const key = `${dayIndex}-${slotIndex}`;
              const count = heatmap[key] || 0;

              return (
                <div
                  key={key}
                  data-key={key}                // 🔥 중요
                  className={`cell ${
                    mySelected.has(key) ? "me" : ""
                  }`}
                  style={{
                    background:
                      count > 0
                        ? `rgba(139, 92, 246, ${0.15 * count})`
                        : undefined,
                  }}
                  onMouseDown={() => handleMouseDown(key)}
                  onMouseEnter={() => handleMouseEnter(key)}
                  onTouchStart={() => handleMouseDown(key)}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
