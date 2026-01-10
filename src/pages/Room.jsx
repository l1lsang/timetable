import { useState, useEffect, useMemo, useRef } from "react";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import Timetable from "../Timetable";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const START_HOUR = 9;

function slotIndexToTime(slotIndex) {
  const totalMinutes = START_HOUR * 60 + slotIndex * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function formatSlot(key, count) {
  const [dayIndex, slotIndex] = key.split("-").map(Number);
  const start = slotIndexToTime(slotIndex);
  const end = slotIndexToTime(slotIndex + 1);
  return `${DAYS[dayIndex]} ${start} ~ ${end} (${count}명)`;
}

export default function Room() {
  const roomId = localStorage.getItem("roomId");
  const userId = localStorage.getItem("userId");

  const [mySelection, setMySelection] = useState(new Set());
  const [allSelections, setAllSelections] = useState([]);
  const [members, setMembers] = useState([]);

  const [saveState, setSaveState] = useState("saved");
  const saveTimerRef = useRef(null);
  const restoredRef = useRef(false);

  /* 🔄 selections 구독 */
  useEffect(() => {
    if (!roomId || !userId) return;

    const ref = collection(db, "rooms", roomId, "selections");

    const unsub = onSnapshot(ref, (snap) => {
      const list = [];
      snap.forEach((d) => {
        list.push({
          userId: d.id,
          slots: d.data().slots || [],
        });
      });

      setAllSelections(list);

      const mine = list.find((d) => d.userId === userId);
      if (mine && !restoredRef.current) {
        setMySelection(new Set(mine.slots));
        restoredRef.current = true;
      }
    });

    return () => unsub();
  }, [roomId, userId]);

  /* 👥 members 구독 */
  useEffect(() => {
    if (!roomId) return;

    const ref = collection(db, "rooms", roomId, "members");

    const unsub = onSnapshot(ref, (snap) => {
      const list = [];
      snap.forEach((d) => {
        list.push({
          userId: d.id,
          nickname: d.data().nickname,
        });
      });
      setMembers(list);
    });

    return () => unsub();
  }, [roomId]);

  /* 💾 저장 */
  const handleSaveSelection = (nextSet) => {
    setMySelection(nextSet);
    setSaveState("saving");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      await setDoc(
        doc(db, "rooms", roomId, "selections", userId),
        {
          slots: Array.from(nextSet),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      setSaveState("saved");
    }, 300);
  };

  /* 📊 히트맵 */
  const heatmap = useMemo(() => {
    const map = {};
    allSelections.forEach(({ slots }) => {
      slots.forEach((k) => {
        map[k] = (map[k] || 0) + 1;
      });
    });
    return map;
  }, [allSelections]);

  const top3 = useMemo(() => {
    return Object.entries(heatmap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [heatmap]);

  return (
    <div className="page">
      <div className="content">
        {/* 📅 시간표 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: 13 }}>
            {saveState === "saving" ? "저장 중…" : "저장됨 ✓"}
          </div>

          <Timetable
            value={mySelection}
            heatmap={heatmap}
            onChange={(next) => {
              const copied = new Set(next);
              handleSaveSelection(copied);
            }}
          />
        </div>

        {/* 🏆 사이드 패널 */}
        <div className="side-panel">
          <h3>👥 참여 중인 사람</h3>

          {members.map((m) => (
            <p key={m.userId}>
              {m.nickname}
              {m.userId === userId && " (나)"}
            </p>
          ))}

          <hr style={{ margin: "12px 0", opacity: 0.3 }} />

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
