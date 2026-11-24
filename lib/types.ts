export type TrainingVideo = {
  id: string;
  title: string;
  description: string | null;
  part_number: number;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
};

export const PARTS = Array.from({ length: 10 }, (_, index) => ({
  number: index + 1,
  start: index * 15 + 1,
  end: (index + 1) * 15,
  label: `Part ${index * 15 + 1}–${(index + 1) * 15}`,
}));
