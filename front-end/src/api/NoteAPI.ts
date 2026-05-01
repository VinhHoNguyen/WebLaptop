import axiosClient from "./axiosClient";

const NoteAPI = {
  post_note: (data: Record<string, unknown>) => {
    const url = "/api/Note";
    return axiosClient.post(url, data);
  },

  get_note: (id: string) => {
    const url = `/api/Note/${id}`;
    return axiosClient.get(url);
  },
};

export default NoteAPI;
