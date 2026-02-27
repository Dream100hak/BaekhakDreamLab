/**
 * 꿈 해몽 사전 관련 타입 정의
 * word.json 구조 기반 (Supabase 마이그레이션 시 참고)
 */

/** 한 개 키워드의 로또 번호 매핑 정보 */
export interface DreamKeywordEntry {
  /** 매칭되는 로또 번호 목록 (1~45) */
  nums: number[];
  /** 중요도/추천도 (0: 일반, 1 이상: 별표) */
  star: number;
  /** 키워드 원문 */
  word: string;
  /** 보너스 번호 관련 데이터 (선택) - 일부 키워드에만 존재 */
  finish_length_data?: number[];
  /** 보너스 번호 체크 데이터 (선택) */
  finish_num_check?: number[];
}

/** 초성(ㄱ, ㄴ, ...)별로 그룹화된 키워드 맵 */
export type DreamDictionaryByChosung = Record<string, Record<string, DreamKeywordEntry>>;

/** 전체 꿈 해몽 사전 구조 (word.json 원본 형식) */
export type DreamDictionary = DreamDictionaryByChosung;

/** 사전 조회 결과 (단일 키워드) */
export interface DreamLookupResult {
  /** 조회한 키워드 */
  keyword: string;
  /** 매칭된 엔트리 (없으면 null) */
  entry: DreamKeywordEntry | null;
  /** 매칭된 로또 번호 (없으면 빈 배열) */
  nums: number[];
}

/** 다중 키워드 조회 결과 */
export interface DreamMultiLookupResult {
  /** 전체 조회된 키워드 목록 */
  keywords: string[];
  /** 각 키워드별 조회 결과 */
  results: DreamLookupResult[];
  /** 중복 제거된 전체 로또 번호 목록 */
  mergedNums: number[];
}
