import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** 로컬에서 127.0.0.1 / localhost 혼용 시 dev 리소스 cross-origin 경고 완화 */
  allowedDevOrigins: ["http://127.0.0.1:3000", "http://localhost:3000"],
  /**
   * 하단 개발 도구 인디케이터(세그먼트 탐색 등) 비활성화.
   * 일부 환경에서 `SegmentViewNode` / React Client Manifest 관련 런타임 오류가 날 수 있어 끕니다.
   */
  devIndicators: false,
};

export default nextConfig;
