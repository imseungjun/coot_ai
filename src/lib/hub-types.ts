export type HubLink = {
  id: string;
  name: string;
  url: string;
  /** 사용자 지정 아이콘 URL. 없으면 파비콘 자동 */
  iconUrl?: string;
};

export type HubCategory = {
  id: string;
  name: string;
  order: number;
  links: HubLink[];
};

export type HubState = {
  version: 1;
  categories: HubCategory[];
};
