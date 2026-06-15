(function() {
  var MountainRacer = window.MountainRacer || {};

  var DAILY_CHALLENGE_TEMPLATES = [
    {
      id: 'daily_score_1',
      type: 'score',
      title: '得分达人',
      description: '单局游戏得分达到 {target} 分',
      icon: '🏆',
      targets: [3000, 5000, 8000],
      rewards: [
        { coins: 100, seasonXP: 20 },
        { coins: 200, seasonXP: 40 },
        { coins: 400, seasonXP: 80 }
      ]
    },
    {
      id: 'daily_distance_1',
      type: 'distance',
      title: '耐力车手',
      description: '单局行驶距离达到 {target} 米',
      icon: '📏',
      targets: [1500, 2500, 4000],
      rewards: [
        { coins: 100, seasonXP: 20 },
        { coins: 200, seasonXP: 40 },
        { coins: 400, seasonXP: 80 }
      ]
    },
    {
      id: 'daily_speed_1',
      type: 'maxSpeed',
      title: '极速狂飙',
      description: '单局最高速度达到 {target} km/h',
      icon: '🚀',
      targets: [100, 140, 180],
      rewards: [
        { coins: 120, seasonXP: 25 },
        { coins: 240, seasonXP: 50 },
        { coins: 480, seasonXP: 100 }
      ]
    },
    {
      id: 'daily_combo_1',
      type: 'maxCombo',
      title: '连击大师',
      description: '单局最高连击达到 {target} 次',
      icon: '🔥',
      targets: [5, 10, 20],
      rewards: [
        { coins: 120, seasonXP: 25 },
        { coins: 240, seasonXP: 50 },
        { coins: 480, seasonXP: 100 }
      ]
    },
    {
      id: 'daily_collect_1',
      type: 'collectibles',
      title: '收集达人',
      description: '单局收集 {target} 个收集品',
      icon: '💎',
      targets: [5, 10, 20],
      rewards: [
        { coins: 100, seasonXP: 20 },
        { coins: 200, seasonXP: 40 },
        { coins: 400, seasonXP: 80 }
      ]
    },
    {
      id: 'daily_stars_1',
      type: 'stars',
      title: '星级挑战',
      description: '单局获得 {target} 星评价',
      icon: '⭐',
      targets: [1, 2, 3],
      rewards: [
        { coins: 150, seasonXP: 30 },
        { coins: 300, seasonXP: 60 },
        { coins: 600, seasonXP: 120 }
      ]
    },
    {
      id: 'daily_nodamage_1',
      type: 'noDamage',
      title: '完美驾驶',
      description: '无伤完成比赛',
      icon: '🛡️',
      targets: [1, 1, 1],
      rewards: [
        { coins: 200, seasonXP: 40 },
        { coins: 400, seasonXP: 80 },
        { coins: 800, seasonXP: 160 }
      ]
    },
    {
      id: 'daily_airtime_1',
      type: 'airTime',
      title: '空中飞人',
      description: '单局累计空中时间达到 {target} 秒',
      icon: '✈️',
      targets: [3, 6, 10],
      rewards: [
        { coins: 120, seasonXP: 25 },
        { coins: 240, seasonXP: 50 },
        { coins: 480, seasonXP: 100 }
      ]
    },
    {
      id: 'daily_branch_1',
      type: 'branches',
      title: '探索者',
      description: '单局探索 {target} 条分支路线',
      icon: '🗺️',
      targets: [1, 2, 3],
      rewards: [
        { coins: 150, seasonXP: 30 },
        { coins: 300, seasonXP: 60 },
        { coins: 600, seasonXP: 120 }
      ]
    },
    {
      id: 'daily_wins_1',
      type: 'wins',
      title: '常胜将军',
      description: '今日累计完成 {target} 场比赛',
      icon: '🏅',
      targets: [1, 3, 5],
      rewards: [
        { coins: 100, seasonXP: 20 },
        { coins: 250, seasonXP: 50 },
        { coins: 500, seasonXP: 100 }
      ]
    }
  ];

  var ACHIEVEMENTS = {
    first_race: {
      id: 'first_race',
      title: '初出茅庐',
      description: '完成第一场比赛',
      icon: '🎮',
      rarity: 'common',
      reward: { coins: 100 },
      condition: { type: 'totalRaces', value: 1 }
    },
    speed_demon: {
      id: 'speed_demon',
      title: '极速狂魔',
      description: '最高速度达到200 km/h',
      icon: '⚡',
      rarity: 'rare',
      reward: { coins: 500 },
      condition: { type: 'maxSpeed', value: 200 }
    },
    star_collector_10: {
      id: 'star_collector_10',
      title: '星星收集者',
      description: '累计获得10颗星星',
      icon: '⭐',
      rarity: 'common',
      reward: { coins: 300 },
      condition: { type: 'totalStars', value: 10 }
    },
    star_collector_30: {
      id: 'star_collector_30',
      title: '星星大师',
      description: '累计获得30颗星星',
      icon: '🌟',
      rarity: 'rare',
      reward: { coins: 1000 },
      condition: { type: 'totalStars', value: 30 }
    },
    star_collector_50: {
      id: 'star_collector_50',
      title: '星星传奇',
      description: '累计获得50颗星星',
      icon: '💫',
      rarity: 'epic',
      reward: { coins: 3000 },
      condition: { type: 'totalStars', value: 50 }
    },
    perfect_run: {
      id: 'perfect_run',
      title: '完美演绎',
      description: '无伤完成任意关卡并获得3星',
      icon: '💯',
      rarity: 'epic',
      reward: { coins: 1000, seasonXP: 200 },
      condition: { type: 'perfectRun', value: 1 }
    },
    combo_master_50: {
      id: 'combo_master_50',
      title: '连击大师',
      description: '单局最高连击达到50次',
      icon: '🔥',
      rarity: 'rare',
      reward: { coins: 800 },
      condition: { type: 'maxCombo', value: 50 }
    },
    combo_master_100: {
      id: 'combo_master_100',
      title: '连击之神',
      description: '单局最高连击达到100次',
      icon: '🔥🔥',
      rarity: 'legendary',
      reward: { coins: 2000 },
      condition: { type: 'maxCombo', value: 100 }
    },
    distance_100k: {
      id: 'distance_100k',
      title: '千里之行',
      description: '累计行驶距离达到100,000米',
      icon: '🛣️',
      rarity: 'rare',
      reward: { coins: 1500 },
      condition: { type: 'totalDistance', value: 100000 }
    },
    distance_500k: {
      id: 'distance_500k',
      title: '万里长征',
      description: '累计行驶距离达到500,000米',
      icon: '🌍',
      rarity: 'epic',
      reward: { coins: 5000 },
      condition: { type: 'totalDistance', value: 500000 }
    },
    coin_collector: {
      id: 'coin_collector',
      title: '小富翁',
      description: '累计获得10,000金币',
      icon: '💰',
      rarity: 'rare',
      reward: { coins: 2000 },
      condition: { type: 'totalCoins', value: 10000 }
    },
    coin_tycoon: {
      id: 'coin_tycoon',
      title: '大富翁',
      description: '累计获得50,000金币',
      icon: '💎',
      rarity: 'epic',
      reward: { coins: 10000 },
      condition: { type: 'totalCoins', value: 50000 }
    },
    chapter_1_complete: {
      id: 'chapter_1_complete',
      title: '山麓征服者',
      description: '完成第一章所有关卡',
      icon: '🌄',
      rarity: 'rare',
      reward: { coins: 1000, seasonXP: 300 },
      condition: { type: 'chapterComplete', value: 'chapter_1' }
    },
    chapter_2_complete: {
      id: 'chapter_2_complete',
      title: '山道之王',
      description: '完成第二章所有关卡',
      icon: '⛰️',
      rarity: 'epic',
      reward: { coins: 2000, seasonXP: 500 },
      condition: { type: 'chapterComplete', value: 'chapter_2' }
    },
    chapter_3_complete: {
      id: 'chapter_3_complete',
      title: '巅峰传奇',
      description: '完成第三章所有关卡',
      icon: '🏔️',
      rarity: 'legendary',
      reward: { coins: 5000, seasonXP: 1000 },
      condition: { type: 'chapterComplete', value: 'chapter_3' }
    },
    all_stars_chapter_1: {
      id: 'all_stars_chapter_1',
      title: '第一章全星',
      description: '第一章所有关卡获得3星',
      icon: '🏅',
      rarity: 'epic',
      reward: { coins: 3000 },
      condition: { type: 'chapterAllStars', value: 'chapter_1' }
    },
    all_stars_chapter_2: {
      id: 'all_stars_chapter_2',
      title: '第二章全星',
      description: '第二章所有关卡获得3星',
      icon: '🥇',
      rarity: 'legendary',
      reward: { coins: 6000 },
      condition: { type: 'chapterAllStars', value: 'chapter_2' }
    },
    season_1_complete: {
      id: 'season_1_complete',
      title: '赛季王者',
      description: '完成第一赛季所有内容',
      icon: '👑',
      rarity: 'legendary',
      reward: { coins: 10000, seasonXP: 2000 },
      condition: { type: 'seasonComplete', value: 'season_1' }
    },
    car_collector_3: {
      id: 'car_collector_3',
      title: '收藏入门',
      description: '解锁3辆汽车',
      icon: '🚗',
      rarity: 'common',
      reward: { coins: 500 },
      condition: { type: 'carsUnlocked', value: 3 }
    },
    car_collector_5: {
      id: 'car_collector_5',
      title: '汽车收藏家',
      description: '解锁5辆汽车',
      icon: '🚙',
      rarity: 'rare',
      reward: { coins: 2000 },
      condition: { type: 'carsUnlocked', value: 5 }
    },
    power_100: {
      id: 'power_100',
      title: '战力新星',
      description: '战力达到100',
      icon: '⚡',
      rarity: 'common',
      reward: { coins: 300 },
      condition: { type: 'power', value: 100 }
    },
    power_300: {
      id: 'power_300',
      title: '战力精英',
      description: '战力达到300',
      icon: '💪',
      rarity: 'rare',
      reward: { coins: 1000 },
      condition: { type: 'power', value: 300 }
    },
    power_500: {
      id: 'power_500',
      title: '战力传奇',
      description: '战力达到500',
      icon: '🔥',
      rarity: 'epic',
      reward: { coins: 3000 },
      condition: { type: 'power', value: 500 }
    },
    stunt_10: {
      id: 'stunt_10',
      title: '特技新手',
      description: '单局完成10次特技跳跃',
      icon: '🤸',
      rarity: 'common',
      reward: { coins: 200 },
      condition: { type: 'stuntJumps', value: 10 }
    },
    explore_all_branches: {
      id: 'explore_all_branches',
      title: '探索先锋',
      description: '探索任意关卡的所有分支',
      icon: '🗺️',
      rarity: 'rare',
      reward: { coins: 800 },
      condition: { type: 'allBranches', value: 1 }
    },
    loyal_player_7: {
      id: 'loyal_player_7',
      title: '七日签到',
      description: '连续登录7天',
      icon: '📅',
      rarity: 'rare',
      reward: { coins: 2000, seasonXP: 500 },
      condition: { type: 'consecutiveDays', value: 7 }
    },
    loyal_player_30: {
      id: 'loyal_player_30',
      title: '月度铁粉',
      description: '累计登录30天',
      icon: '🏆',
      rarity: 'epic',
      reward: { coins: 5000, seasonXP: 1000 },
      condition: { type: 'totalDays', value: 30 }
    }
  };

  var STAGE_REWARDS = [
    {
      id: 'stage_1',
      name: '新手礼包',
      description: '完成5个任务解锁',
      icon: '🎁',
      requiredTasks: 5,
      reward: { coins: 500, parts: ['engine_sport_discount'] }
    },
    {
      id: 'stage_2',
      name: '成长礼包',
      description: '完成15个任务解锁',
      icon: '📦',
      requiredTasks: 15,
      reward: { coins: 1500, parts: ['tires_racing_discount'] }
    },
    {
      id: 'stage_3',
      name: '精英礼包',
      description: '完成30个任务解锁',
      icon: '🎊',
      requiredTasks: 30,
      reward: { coins: 3000, parts: ['suspension_racing_discount'], seasonXP: 500 }
    },
    {
      id: 'stage_4',
      name: '大师礼包',
      description: '完成50个任务解锁',
      icon: '👑',
      requiredTasks: 50,
      reward: { coins: 6000, cars: ['car_sport_discount'], seasonXP: 1000 }
    },
    {
      id: 'stage_5',
      name: '传奇礼包',
      description: '完成80个任务解锁',
      icon: '💎',
      requiredTasks: 80,
      reward: { coins: 10000, cars: ['car_super_discount'], seasonXP: 2000 }
    }
  ];

  var RARITY_CONFIG = {
    common: { name: '普通', color: '#9e9e9e', glowColor: '#bdbdbd' },
    rare: { name: '稀有', color: '#2196f3', glowColor: '#64b5f6' },
    epic: { name: '史诗', color: '#9c27b0', glowColor: '#ba68c8' },
    legendary: { name: '传说', color: '#ff9800', glowColor: '#ffb74d' }
  };

  function getDayOfYear(date) {
    var start = new Date(date.getFullYear(), 0, 0);
    var diff = date - start;
    var oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  function seedRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  MountainRacer.TaskCenterConfig = {
    getDailyChallenges: function(date) {
      var d = date || new Date();
      var dayOfYear = getDayOfYear(d);
      var year = d.getFullYear();
      var seed = year * 1000 + dayOfYear;

      var shuffled = DAILY_CHALLENGE_TEMPLATES.slice();
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(seedRandom(seed + i) * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }

      var selected = shuffled.slice(0, 3);
      return selected.map(function(template, idx) {
        return {
          id: template.id + '_' + year + '_' + dayOfYear,
          templateId: template.id,
          type: template.type,
          title: template.title,
          description: template.description.replace('{target}', template.targets[0]),
          icon: template.icon,
          tier: 0,
          maxTier: 3,
          targets: template.targets,
          rewards: template.rewards,
          progress: 0,
          claimedTiers: [],
          date: {
            year: year,
            dayOfYear: dayOfYear,
            timestamp: new Date(year, 0, dayOfYear).getTime()
          }
        };
      });
    },

    getAchievements: function() {
      return ACHIEVEMENTS;
    },

    getAchievement: function(id) {
      return ACHIEVEMENTS[id] || null;
    },

    getStageRewards: function() {
      return STAGE_REWARDS;
    },

    getStageReward: function(id) {
      for (var i = 0; i < STAGE_REWARDS.length; i++) {
        if (STAGE_REWARDS[i].id === id) return STAGE_REWARDS[i];
      }
      return null;
    },

    getRarityConfig: function(rarity) {
      return RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
    },

    getAllRarities: function() {
      return RARITY_CONFIG;
    },

    getTodayKey: function() {
      var d = new Date();
      return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },

    isSameDay: function(timestamp1, timestamp2) {
      var d1 = new Date(timestamp1);
      var d2 = new Date(timestamp2);
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    }
  };

  MountainRacer.DAILY_CHALLENGE_TEMPLATES = DAILY_CHALLENGE_TEMPLATES;
  MountainRacer.ACHIEVEMENTS = ACHIEVEMENTS;
  MountainRacer.STAGE_REWARDS = STAGE_REWARDS;
  MountainRacer.RARITY_CONFIG = RARITY_CONFIG;

  window.MountainRacer = MountainRacer;
})();
