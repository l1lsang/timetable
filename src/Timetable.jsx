import {
  useState,
  useMemo,
  Fragment,
  useRef,
} from "react";
import "./timetable.css";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const START_HOUR = 9;
const END_HOUR = 24;
const SLOT_PER_HOUR = 2; // 30분

/**
 * props
 * - value: Set            // 🔥 내 선택 (Room에서 내려옴)
 * - heatmap: { key: num } // 🔥 전체 유저 합산
 * - onChange: (Set) => void  // 🔥 드래그 종료 시 1회
 */
export default function Timetable({
  value,
  heatmap = {},
  onChange,
}) {
  const [dragging, setDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // "add" | "remove"

  // 🔁 이번 드래그에서 이미 처리한 셀
  const visitedRef = useRef(new Set());

  /* =========================
     🎯 셀 적용
  ========================= */
  const apply = (key, mode) => {
    if (!mode) return;
    if (visitedRef.current.has(key)) return;

    visitedRef.current.add(key);

    const next = new Set(value);
    if (mode === "add") next.add(key);
    if (mode === "remove") next.delete(key);

    onChange(next);
  };

  /* =========================
     🖱️ / 📱 드래그 시작
  ========================= */
  const handleStart = (key) => {
    const isSelected = value.has(key);
    const mode = isSelected ? "remove" : "add";

    setDragging(true);
    setDragMode(mode);
    visitedRef.current.clear();

    apply(key, mode);
  };

  /* =========================
     🖱️ 마우스 이동
  ========================= */
  const handleMouseEnter = (key) => {
    if (!dragging) return;
    apply(key, dragMode);
  };

  /* =========================
     📱 터치 이동
  ========================= */
  const handleTouchMove = (e) => {
    if (!dragging) return;

    e.preventDefault();

    const touch = e.touches[0];
    const el = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );

    if (!el || !el.dataset?.key) return;
    apply(el.dataset.key, dragMode);
  };

  /* =========================
     🛑 드래그 종료
  ========================= */
  const handleEnd = () => {
    setDragging(false);
    setDragMode(null);
    visitedRef.current.clear();
  };

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
    <div className="timetable-scroll">
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
              <div className="time">{time}</div>

              {DAYS.map((_, dayIndex) => {
                const key = `${dayIndex}-${slotIndex}`;
                const count = Math.min(heatmap[key] || 0, 5);
                const isMine = value.has(key);

                return (
                  <div
                    key={key}
                    data-key={key}
                    className="cell"
                    style={{
                      background:
                        count > 0
                          ? `hsl(260, 70%, ${96 - count * 6}%)`
                          : "var(--primary-soft)",

                      outline: isMine
                        ? "2px solid var(--primary)"
                        : "none",
                    }}
                    onMouseDown={() => handleStart(key)}
                    onMouseEnter={() => handleMouseEnter(key)}
                    onTouchStart={() => handleStart(key)}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
