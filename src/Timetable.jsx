import {
  useState,
  useMemo,
  Fragment,
  useRef,
  useEffect,
} from "react";
import "./timetable.css";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const START_HOUR = 9;
const END_HOUR = 24;
const SLOT_PER_HOUR = 2;

export default function Timetable({
  value = new Set(),
  heatmap = {},
  onChange,
}) {
  const [dragging, setDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null);

  const visitedRef = useRef(new Set());
  const safeValue = value instanceof Set ? value : new Set();

  const apply = (key, mode) => {
    if (!mode) return;
    if (visitedRef.current.has(key)) return;

    visitedRef.current.add(key);

    const next = new Set(safeValue);
    if (mode === "add") next.add(key);
    if (mode === "remove") next.delete(key);

    onChange?.(next);
  };

  const startDrag = (e, key) => {
    e.preventDefault();
    const mode = safeValue.has(key) ? "remove" : "add";
    setDragging(true);
    setDragMode(mode);
    visitedRef.current.clear();
    apply(key, mode);
  };

  const endDrag = () => {
    setDragging(false);
    setDragMode(null);
    visitedRef.current.clear();
  };

  const handleMove = (e) => {
    if (!dragging) return;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;

    const key = el.dataset?.key;
    if (key) {
      apply(key, dragMode);
    }
  };

  useEffect(() => {
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [dragging, dragMode]);

  const slots = useMemo(() => {
    const arr = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      for (let s = 0; s < SLOT_PER_HOUR; s++) {
        arr.push(`${h}:${s === 0 ? "00" : "30"}`);
      }
    }
    return arr;
  }, []);

  return (
    <div className="timetable-viewport">
    <div className="timetable-scroll">
      <div className="timetable-wrapper">
        <div className="timetable">
          <div className="header empty" />
          {DAYS.map((day) => (
            <div key={day} className="header">{day}</div>
          ))}

          {slots.map((time, slotIndex) => (
            <Fragment key={slotIndex}>
              <div className="time">{time}</div>

              {DAYS.map((_, dayIndex) => {
                const key = `${dayIndex}-${slotIndex}`;
                const count = heatmap[key] || 0;
                const isMine = safeValue.has(key);

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
                    onPointerDown={(e) => startDrag(e, key)}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div></div>
  );
}
