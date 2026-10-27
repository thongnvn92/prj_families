import { apiSlice } from "./apiSlice";
import { albumPhotoFormData, albumPhotoFromApi, albumPhotoListFromApi, type AlbumPhotoResponse } from "./albumApiMapper";
import type { AppRole } from "../context/AuthContext";
import type { AlbumPhoto, UploadAlbumPhotoInput } from "../types/album";

export interface GetPhotosArgs { authKey: AppRole; category?: string }
interface UploadPhotoArgs { authKey: AppRole; data: UploadAlbumPhotoInput }

export const albumApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPhotos: builder.query<AlbumPhoto[], GetPhotosArgs>({
      query: ({ category }) => ({ url: "/album", params: category ? { category } : undefined }),
      transformResponse: albumPhotoListFromApi,
      providesTags: ["Photos"],
    }),
    uploadPhoto: builder.mutation<AlbumPhoto, UploadPhotoArgs>({
      query: ({ data }) => ({ url: "/album", method: "POST", body: albumPhotoFormData(data) }),
      transformResponse: (response: AlbumPhotoResponse) => albumPhotoFromApi(response.data!),
      invalidatesTags: ["Photos"],
    }),
  }),
});

export const { useGetPhotosQuery, useUploadPhotoMutation } = albumApiSlice;

