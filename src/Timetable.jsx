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
     🖱️ 드래그 선택 로직
  ========================= */
  const toggle = (key) => {
    setMySelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const onDown = (key) => {
    setDragging(true);
    toggle(key);
  };

  const onEnter = (key) => {
    if (dragging) toggle(key);
  };

  const onUp = () => setDragging(false);

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
      className="timetable"
      onMouseUp={onUp}
      onTouchEnd={onUp}
    >
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
                className={`cell ${mySelected.has(key) ? "me" : ""}`}
                style={{
                  background:
                    count > 0
                      ? `rgba(139, 92, 246, ${0.15 * count})`
                      : undefined,
                }}
                onMouseDown={() => onDown(key)}
                onMouseEnter={() => onEnter(key)}
                onTouchStart={() => onDown(key)}
                onTouchMove={() => onEnter(key)}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
