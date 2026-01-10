import {
  useState,
  useEffect,
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
 * - heatmap: { "day-slot": number }
 * - onChange: (Set) => void  // 🔥 드래그 종료 시 한 번만 호출
 */
export default function Timetable({ heatmap = {}, onChange }) {
  const [dragging, setDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // "add" | "remove"
  const [mySelected, setMySelected] = useState(new Set());

  // 🔁 이번 드래그에서 이미 처리한 셀
  const visitedRef = useRef(new Set());

  /* =========================
     🎯 셀 적용 (add / remove)
  ========================= */
  const apply = (key, mode = dragMode) => {
    if (!mode) return;
    if (visitedRef.current.has(key)) return;

    visitedRef.current.add(key);

    setMySelected((prev) => {
      const next = new Set(prev);

      if (mode === "add") next.add(key);
      if (mode === "remove") next.delete(key);

      return next;
    });
  };

  /* =========================
     🖱️ / 📱 드래그 시작
  ========================= */
  const handleStart = (key) => {
    const isSelected = mySelected.has(key);
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
    apply(key);
  };

  /* =========================
     📱 터치 이동 (핵심)
  ========================= */
  const handleTouchMove = (e) => {
    if (!dragging) return;

    e.preventDefault(); // 🔥 모바일 스크롤 방지

    const touch = e.touches[0];
    const el = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );

    if (!el || !el.dataset?.key) return;
    apply(el.dataset.key);
  };

  /* =========================
     🛑 드래그 종료
  ========================= */
  const handleEnd = () => {
    setDragging(false);
    setDragMode(null);
    visitedRef.current.clear();

    // 🔥 여기서만 부모에게 전달 (Firestore 저장용)
    onChange?.(mySelected);
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
        <div key={day} className="header">{day}</div>
      ))}

      {/* 시간표 본문 */}
      {slots.map((time, slotIndex) => (
        <Fragment key={slotIndex}>
          <div className="time">{time}</div>

          {DAYS.map((_, dayIndex) => {
            const key = `${dayIndex}-${slotIndex}`;
            const count = Math.min(heatmap[key] || 0, 5);

            return (
              <div
                key={key}
                data-key={key}
                className={`cell ${mySelected.has(key) ? "me" : ""}`}
style={{
  background: mySelected.has(key)
    ? "var(--primary)"          // 내 선택
    : count > 0
    ? `hsl(250, 70%, ${98 - count * 6}%)`
    : "var(--primary-soft)",
}}

              onMouseDown={() => {
  handleStart(key);
}}

onMouseEnter={() => {
  handleMouseEnter(key);
}}

onTouchStart={() => {
  handleStart(key);
}}

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
