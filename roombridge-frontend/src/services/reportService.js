import api from "./api";

/** User reporting API calls */
const reportService = {
  submitReport: async (payload) => (await api.post("/reports", payload)).data,
  getMyReports: async (params = {}) =>
    (await api.get("/reports/my-reports", { params })).data,
};

export default reportService;
