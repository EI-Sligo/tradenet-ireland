export const MOCK_BENCH_POSTS = [
  {
    id: '1',
    profiles: {
      full_name: 'SparkyDan',
      avatar_url: 'https://i.pravatar.cc/150?u=dan',
      trade: 'electrical_installation',
      current_phase: 'phase_6', // Added missing property
    },
    title: 'Sync EV Charger Install',
    content: 'Got the Sync EV wall charger hooked up and set to a 16A limit on a 2.5mm² SWA line. Clean run from the board.',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
    media_type: 'video',
    tags: ['Phase 6', 'EV Charging'],
    likes_count: 24,
    comments_count: 5,
    has_liked: false,
    created_at: '2026-11-01T08:30:00Z',
  },
  {
    id: '2',
    profiles: {
      full_name: 'InstruTech',
      avatar_url: 'https://i.pravatar.cc/150?u=instru',
      trade: 'electrical_instrumentation',
      current_phase: 'phase_2', // Added missing property
    },
    title: 'Phase 2 Lab Setup',
    content: 'Setting up the industrial control loops for the MSLETB apprentices tomorrow. Dialing in the vortex flowmeters.',
    media_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop', 
    media_type: 'image',
    tags: ['Phase 2', 'Calibration'],
    likes_count: 89,
    comments_count: 12,
    has_liked: true,
    created_at: '2026-10-31T14:15:00Z',
  },
  {
    id: '3',
    profiles: {
      full_name: 'SolarSligo',
      avatar_url: 'https://i.pravatar.cc/150?u=solar',
      trade: 'renewable_energy',
      current_phase: 'phase_4', // Added missing property
    },
    title: 'Ground Mount PV Array',
    content: 'Prepping the frame for the N-type TOPCon bifacial panels today. Weather is holding up!',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 
    media_type: 'video',
    tags: ['Phase 4', 'Solar'],
    likes_count: 12,
    comments_count: 1,
    has_liked: false,
    created_at: '2026-10-30T09:00:00Z',
  }
];