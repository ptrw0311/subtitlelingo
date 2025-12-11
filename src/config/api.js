// n8n Webhook API 設定
export const API_CONFIG = {
  // n8n Hugging Face Space 的 URL
  baseURL: import.meta.env.VITE_N8N_API_URL || 'https://your-space.hf.space/webhook',

  // API 端點
  endpoints: {
    // 取得熱門影片列表
    getPopularMovies: '/movies/popular',

    // 搜尋影片
    searchMovies: '/movies/search',

    // 分析影片字幕
    analyzeMovie: '/movies/{id}/analyze',

    // 取得影片詳細資料
    getMovieDetails: '/movies/{id}/details',
  },

  // 請求設定
  headers: {
    'Content-Type': 'application/json',
  },

  // 超時設定（毫秒）
  timeout: 30000,
};

// 建立完整的 API URL
export const buildApiUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.baseURL}${endpoint}`;

  // 替換路徑參數
  Object.keys(params).forEach(key => {
    url = url.replace(`{${key}}`, params[key]);
  });

  return url;
};

// 通用 API 請求函數
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint, options.pathParams);

  const config = {
    headers: { ...API_CONFIG.headers, ...options.headers },
    ...options,
  };

  // 添加查詢參數
  if (options.query) {
    const searchParams = new URLSearchParams(options.query);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 請求失敗:', error);
    throw error;
  }
};

// 具體 API 方法
export const movieAPI = {
  // 取得熱門影片
  getPopular: (page = 1) => {
    return apiRequest(API_CONFIG.endpoints.getPopularMovies, {
      query: { page }
    });
  },

  // 搜尋影片
  search: (query, page = 1) => {
    return apiRequest(API_CONFIG.endpoints.searchMovies, {
      query: { q: query, page }
    });
  },

  // 分析影片
  analyze: (movieId) => {
    return apiRequest(API_CONFIG.endpoints.analyzeMovie, {
      pathParams: { id: movieId }
    });
  },

  // 取得影片詳細資料
  getDetails: (movieId) => {
    return apiRequest(API_CONFIG.endpoints.getMovieDetails, {
      pathParams: { id: movieId }
    });
  },
};