use chrono::{Duration, Utc};
use std::sync::RwLock;

use crate::model::*;

/// Mock database for development — mirrors Go implementation
pub struct MockDb {
    pub souls: RwLock<Vec<Soul>>,
    pub arena_events: RwLock<Vec<ArenaEvent>>,
    pub talent_suggestions: RwLock<Vec<TalentSuggestion>>,
}

impl MockDb {
    pub fn new() -> Self {
        let now = Utc::now();

        let souls = vec![Soul {
            id: "roy-soul".into(),
            seeker_name: "Roy".into(),
            current_level: "Flame".into(),
            ember_points: 1250,
            total_talents: 7,
            active_talents: 3,
            conviction_level: 68,
            next_milestone: "Reach 1500 Ember to unlock Blaze level".into(),
            arena_eligible: true,
            last_activity: now,
            talents: vec![
                Talent {
                    id: "programming-talent".into(),
                    name: "프로그래밍".into(),
                    category: "analytical".into(),
                    progress_percentage: 85,
                    ember_earned: 420,
                    days_active: 45,
                    mastery_level: "advanced".into(),
                },
                Talent {
                    id: "design-talent".into(),
                    name: "시각적 디자인".into(),
                    category: "creative".into(),
                    progress_percentage: 62,
                    ember_earned: 280,
                    days_active: 28,
                    mastery_level: "proficient".into(),
                },
                Talent {
                    id: "leadership-talent".into(),
                    name: "리더십".into(),
                    category: "social".into(),
                    progress_percentage: 45,
                    ember_earned: 180,
                    days_active: 18,
                    mastery_level: "developing".into(),
                },
            ],
        }];

        let arena_events = vec![
            ArenaEvent {
                id: "arena-1".into(),
                title: "코딩 배틀 로얄".into(),
                description: "실시간 알고리즘 대전".into(),
                talent_type: "programming".into(),
                difficulty: "advanced".into(),
                participants: 24,
                prize: "500 Ember Points".into(),
                status: "live".into(),
                start_time: now - Duration::hours(1),
                end_time: now + Duration::hours(1),
            },
            ArenaEvent {
                id: "arena-2".into(),
                title: "디자인 챌린지".into(),
                description: "30분 UI 디자인 경쟁".into(),
                talent_type: "design".into(),
                difficulty: "intermediate".into(),
                participants: 16,
                prize: "300 Ember Points".into(),
                status: "upcoming".into(),
                start_time: now + Duration::hours(2),
                end_time: now + Duration::hours(4),
            },
        ];

        let talent_suggestions = vec![
            TalentSuggestion {
                id: "ai-coding".into(),
                name: "AI 코딩".into(),
                category: "analytical".into(),
                description: "GPT와 협업하는 차세대 개발".into(),
                difficulty: "intermediate".into(),
                trending: true,
            },
            TalentSuggestion {
                id: "web3-design".into(),
                name: "Web3 UI/UX".into(),
                category: "creative".into(),
                description: "블록체인 앱 디자인".into(),
                difficulty: "advanced".into(),
                trending: true,
            },
            TalentSuggestion {
                id: "content-creation".into(),
                name: "콘텐츠 크리에이션".into(),
                category: "creative".into(),
                description: "영상/글/이미지 콘텐츠 제작".into(),
                difficulty: "beginner".into(),
                trending: false,
            },
            TalentSuggestion {
                id: "public-speaking".into(),
                name: "대중 연설".into(),
                category: "social".into(),
                description: "효과적인 커뮤니케이션 및 프레젠테이션".into(),
                difficulty: "intermediate".into(),
                trending: false,
            },
        ];

        Self {
            souls: RwLock::new(souls),
            arena_events: RwLock::new(arena_events),
            talent_suggestions: RwLock::new(talent_suggestions),
        }
    }

    pub fn get_all_souls(&self) -> Vec<Soul> {
        self.souls.read().unwrap().clone()
    }

    pub fn get_soul(&self, id: &str) -> Option<Soul> {
        self.souls.read().unwrap().iter().find(|s| s.id == id).cloned()
    }

    pub fn get_soul_by_user(&self, _user_id: &str) -> Option<Soul> {
        // Mock: return first soul
        self.souls.read().unwrap().first().cloned()
    }

    pub fn create_soul(&self, req: &CreateSoulRequest) -> Soul {
        let now = Utc::now();
        let soul = Soul {
            id: format!("soul-{}", now.timestamp_millis()),
            seeker_name: req.seeker_name.clone(),
            current_level: "Sparked".into(),
            ember_points: 0,
            total_talents: 0,
            active_talents: 0,
            conviction_level: 0,
            next_milestone: "Record your first talent entry".into(),
            arena_eligible: false,
            last_activity: now,
            talents: vec![],
        };
        self.souls.write().unwrap().push(soul.clone());
        soul
    }

    pub fn get_arena_events(&self) -> Vec<ArenaEvent> {
        self.arena_events.read().unwrap().clone()
    }

    pub fn get_talent_suggestions(&self) -> Vec<TalentSuggestion> {
        self.talent_suggestions.read().unwrap().clone()
    }

    pub fn get_trending_talents(&self) -> Vec<TalentSuggestion> {
        self.talent_suggestions
            .read()
            .unwrap()
            .iter()
            .filter(|t| t.trending)
            .cloned()
            .collect()
    }
}
