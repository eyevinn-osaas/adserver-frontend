export interface Session {
  sessionId: string;
  userId: string;
  created: string;
  adBreakDuration: string;
  clientRequest: {
    dur: string;
    uip: string;
    userAgent: string;
    acceptLang: string;
    host: string;
  };
  response: string;
}

export interface TrackingEvent {
  type: string;
  issuedAt: string;
  onAd: string;
  userAgent: string;
}

export interface VastRequest {
  c?: boolean;
  dur?: string;
  skip?: string;
  uid?: string;
  os?: string;
  dt?: string;
  ss?: string;
  uip?: string;
  min?: string;
  max?: string;
  ps?: string;
  v?: string;
  userAgent?: string;
  coll?: string;
}

export interface VmapRequest extends VastRequest {
  bp?: string;
  prr?: string;
  por?: string;
}

export interface AdResponse {
  xml: string;
  sessionId: string;
}

export interface SessionsResponse {
  previousPage: number | null;
  currentPage: number;
  nextPage: number | null;
  totalPages: number;
  limit: number;
  totalItems: number;
  data: Session[];
}

export interface EventsResponse {
  events: TrackingEvent[];
  total: number;
}