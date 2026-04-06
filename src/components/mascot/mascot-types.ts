export type MascotMode = "idle" | "walk" | "jump" | "inspect";

export const MASCOT_STORAGE_DISABLED = "coot-mascot-disabled";

/** 뷰포트 하단 기준, 캐릭터 박스의 bottom 오프셋(px) — 바닥 레일 */
export const MASCOT_RAIL_BOTTOM_PX = 20;

/** 캐릭터 표시 박스(이미지 크기 기준). 좌우 이동 클램프에 사용 */
export const MASCOT_BODY_W = 60;
export const MASCOT_BODY_H = 74;

/** MascotAgent 래퍼 높이(그림자 여유 포함) — 전역 이동 시 top 클램프에 사용 */
export const MASCOT_CONTAINER_H = MASCOT_BODY_H + 9;
