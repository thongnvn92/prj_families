import { apiSlice, runMockQuery } from "./apiSlice";
import type { AppRole } from "../context/AuthContext";
import { getPhotos, uploadPhoto } from "../services/albumService";
import type { AlbumPhoto, UploadAlbumPhotoInput } from "../types/album";

interface UploadPhotoArgs { role: AppRole; data: UploadAlbumPhotoInput }

export const albumApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPhotos: builder.query<AlbumPhoto[], AppRole>({
      queryFn: (role) => runMockQuery(() => getPhotos(role)),
      providesTags: ["Photos"],
    }),
    uploadPhoto: builder.mutation<AlbumPhoto, UploadPhotoArgs>({
      queryFn: ({ role, data }) => runMockQuery(() => uploadPhoto(data, role)),
      invalidatesTags: ["Photos"],
    }),
  }),
});

export const { useGetPhotosQuery, useUploadPhotoMutation } = albumApiSlice;
