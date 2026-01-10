import { useState, useEffect, useMemo, useRef } from "react";
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
     🧑‍🤝‍🧑 전체 선택
  ========================= */
  const [allSelections, setAllSelections] = useState([]);

  /* =========================
     👥 참여자 목록
  ========================= */
  const [members, setMembers] = useState([]);

  /* =========================
     💾 저장 상태 UI
  ========================= */
  const [saveState, setSaveState] = useState("saved"); 
  // "saving" | "saved"

  const saveTimerRef = useRef(null);

  /* =========================
     🔄 selections 실시간 구독
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
     👥 members 실시간 구독
  ========================= */
  useEffect(() => {
    if (!roomId) return;

    const ref = collection(db, "rooms", roomId, "members");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({
          userId: doc.id,
          nickname: doc.data().nickname,
        });
      });
      setMembers(list);
    });

    return () => unsubscribe();
  }, [roomId]);

  /* =========================
     💾 내 선택 저장
  ========================= */
  const handleSaveSelection = async (set) => {
    setMySelection(set);
    setSaveState("saving");

    // debounce 느낌 (UI 안정)
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      await setDoc(
        doc(db, "rooms", roomId, "selections", userId),
        {
          slots: Array.from(set),
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      setSaveState("saved");
    }, 300);
  };

  /* =========================
     📊 히트맵 계산
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
        {/* =========================
            📅 시간표
        ========================= */}
        <div>
          <div style={{ marginBottom: 8, fontSize: 13, color: "#666" }}>
            {saveState === "saving" ? "저장 중…" : "저장됨 ✓"}
          </div>

          <Timetable
            heatmap={heatmap}
            onChange={handleSaveSelection}
          />
        </div>

        {/* =========================
            🏆 사이드 패널
        ========================= */}
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
