'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Meeting, QAMessage, ProcessingProgress } from '@/types';

interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
}

interface MeetingStore {
  meetings: Meeting[];
  currentMeetingId: string | null;
  player: PlayerState;
  processing: ProcessingProgress | null;
  qaMessages: Record<string, QAMessage[]>;

  // Meeting actions
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, data: Partial<Meeting>) => void;
  removeMeeting: (id: string) => void;
  setCurrentMeeting: (id: string | null) => void;
  getMeeting: (id: string) => Meeting | undefined;

  // Player actions
  setPlayerState: (state: Partial<PlayerState>) => void;
  seekTo: (time: number) => void;
  togglePlayback: () => void;
  setPlaybackRate: (rate: number) => void;

  // Processing
  setProcessing: (progress: ProcessingProgress | null) => void;

  // Q&A
  addQAMessage: (meetingId: string, message: QAMessage) => void;
  getQAMessages: (meetingId: string) => QAMessage[];
}

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      meetings: [],
      currentMeetingId: null,
      player: {
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        playbackRate: 1,
      },
      processing: null,
      qaMessages: {},

      addMeeting: (meeting) =>
        set((state) => ({
          meetings: [meeting, ...state.meetings],
        })),

      updateMeeting: (id, data) =>
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
          ),
        })),

      removeMeeting: (id) =>
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
        })),

      setCurrentMeeting: (id) => set({ currentMeetingId: id }),

      getMeeting: (id) => get().meetings.find((m) => m.id === id),

      setPlayerState: (playerState) =>
        set((state) => ({
          player: { ...state.player, ...playerState },
        })),

      seekTo: (time) =>
        set((state) => ({
          player: { ...state.player, currentTime: time },
        })),

      togglePlayback: () =>
        set((state) => ({
          player: { ...state.player, isPlaying: !state.player.isPlaying },
        })),

      setPlaybackRate: (rate) =>
        set((state) => ({
          player: { ...state.player, playbackRate: rate },
        })),

      setProcessing: (progress) => set({ processing: progress }),

      addQAMessage: (meetingId, message) =>
        set((state) => ({
          qaMessages: {
            ...state.qaMessages,
            [meetingId]: [...(state.qaMessages[meetingId] || []), message],
          },
        })),

      getQAMessages: (meetingId) => get().qaMessages[meetingId] || [],
    }),
    {
      name: 'echolens-storage',
      partialize: (state) => ({
        meetings: state.meetings,
        qaMessages: state.qaMessages,
      }),
    }
  )
);
