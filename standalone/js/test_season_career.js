(function() {
  console.log('🏁 赛季生涯模式模块测试初始化...');

  var tests = [];
  var passed = 0;
  var failed = 0;

  function test(name, fn) {
    tests.push({ name: name, fn: fn });
  }

  function runTests() {
    console.log('\n========== 开始测试 ==========\n');
    for (var i = 0; i < tests.length; i++) {
      var t = tests[i];
      try {
        var result = t.fn();
        if (result === true || (result && result.success)) {
          console.log('✅ PASS: ' + t.name);
          passed++;
        } else {
          console.log('❌ FAIL: ' + t.name + ' -> ' + JSON.stringify(result));
          failed++;
        }
      } catch (e) {
        console.log('❌ ERROR: ' + t.name + ' -> ' + e.message);
        console.log(e.stack);
        failed++;
      }
    }
    console.log('\n========== 测试结果 ==========');
    console.log('通过: ' + passed + ' / ' + tests.length);
    console.log('失败: ' + failed + ' / ' + tests.length);
    console.log('完成度: ' + Math.floor((passed / tests.length) * 100) + '%\n');
    return { passed: passed, failed: failed, total: tests.length };
  }

  // ===== 模块存在性测试 =====
  test('SeasonConfig 模块存在', function() {
    return typeof MountainRacer !== 'undefined' &&
           typeof MountainRacer.SeasonConfig !== 'undefined';
  });

  test('SeasonConfig 可获取赛季配置', function() {
    var season = MountainRacer.SeasonConfig.getCurrentSeason();
    return season && season.id === 'season_1' && Array.isArray(season.chapters);
  });

  test('SeasonConfig 可获取章节配置', function() {
    var chapters = MountainRacer.SeasonConfig.getChaptersBySeason('season_1');
    return chapters.length === 3 && chapters[0].id === 'chapter_1';
  });

  test('SeasonConfig 可获取节点配置', function() {
    var node = MountainRacer.SeasonConfig.getNode('chapter_1', 'node_1_1');
    return node && node.id === 'node_1_1' && node.isStart === true;
  });

  test('SeasonConfig 可获取事件类型', function() {
    var evt = MountainRacer.SeasonConfig.getEventType('time_trial');
    return evt && evt.name === '时间挑战';
  });

  test('SeasonConfig 可获取赛季等级', function() {
    var lvl = MountainRacer.SeasonConfig.getSeasonLevel(1);
    return lvl && lvl.title === '新秀车手';
  });

  test('SeasonConfig 可根据XP获取等级', function() {
    var lvl = MountainRacer.SeasonConfig.getSeasonLevelByXP(150);
    return lvl && lvl.level === 2;
  });

  // ===== 赛季配置完整性测试 =====
  test('所有章节包含起点和终点节点', function() {
    var chapters = MountainRacer.SeasonConfig.getChaptersBySeason('season_1');
    for (var i = 0; i < chapters.length; i++) {
      var hasStart = false;
      var hasEnd = false;
      for (var j = 0; j < chapters[i].nodes.length; j++) {
        if (chapters[i].nodes[j].isStart) hasStart = true;
        if (chapters[i].nodes[j].isEnd) hasEnd = true;
      }
      if (!hasStart || !hasEnd) {
        return { success: false, chapter: chapters[i].id, hasStart: hasStart, hasEnd: hasEnd };
      }
    }
    return true;
  });

  test('所有节点都有解锁条件或为起始节点', function() {
    var chapters = MountainRacer.SeasonConfig.getChaptersBySeason('season_1');
    for (var i = 0; i < chapters.length; i++) {
      for (var j = 0; j < chapters[i].nodes.length; j++) {
        var node = chapters[i].nodes[j];
        if (!node.isStart && !node.unlockRequirement) {
          return { success: false, nodeId: node.id, reason: '缺少解锁条件' };
        }
      }
    }
    return true;
  });

  test('所有奖励部件ID有效', function() {
    var chapters = MountainRacer.SeasonConfig.getChaptersBySeason('season_1');
    for (var i = 0; i < chapters.length; i++) {
      for (var j = 0; j < chapters[i].nodes.length; j++) {
        var rewards = chapters[i].nodes[j].rewards || {};
        if (rewards.parts) {
          for (var k = 0; k < rewards.parts.length; k++) {
            var partId = rewards.parts[k].replace(/_unlock|_discount|_upgrade/g, '');
            var info = MountainRacer.PartsConfig.getPartById(partId);
            if (!info) {
              return { success: false, node: chapters[i].nodes[j].id, invalidPart: partId };
            }
          }
        }
      }
    }
    return true;
  });

  // ===== SeasonDataManager 测试 (需要DataManager) =====
  test('DataManager 可获取 SeasonDataManager', function() {
    if (!MountainRacer.DataManager) return { success: false, reason: 'DataManager undefined' };
    var dm = MountainRacer.DataManager.getInstance();
    dm.init();
    var sdm = dm.getSeasonDataManager();
    return typeof sdm !== 'undefined' && sdm !== null;
  });

  test('SeasonDataManager 可获取当前赛季', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    var season = sdm.getCurrentSeason();
    return season && season.id === 'season_1';
  });

  test('SeasonDataManager 初始XP和等级正确', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    return sdm.getSeasonXP() >= 0 && sdm.getSeasonLevel() >= 1;
  });

  test('SeasonDataManager 添加XP正常', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    var beforeXP = sdm.getSeasonXP();
    var result = sdm.addSeasonXP(50, 'test');
    var afterXP = sdm.getSeasonXP();
    return result.added === 50 && afterXP === beforeXP + 50;
  });

  test('SeasonDataManager 可检查章节解锁', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    var unlocked = sdm.isChapterUnlocked('chapter_1');
    return unlocked === true;
  });

  test('SeasonDataManager 可获取总星星数', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    var stars = sdm.getTotalStars();
    return typeof stars === 'number' && stars >= 0;
  });

  test('SeasonDataManager 可获取赛季等级进度', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    var progress = sdm.getSeasonLevelProgress();
    return progress && typeof progress.percent === 'number' && progress.level >= 1;
  });

  // ===== EventLevelManager 测试 =====
  test('DataManager 可获取 EventLevelManager', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var elm = dm.getEventLevelManager();
    return typeof elm !== 'undefined' && elm !== null;
  });

  test('EventLevelManager 可初始化事件关卡', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var elm = dm.getEventLevelManager();
    var sdm = dm.getSeasonDataManager();
    sdm.setCurrentChapter('chapter_1');
    var result = elm.initializeEvent('chapter_1', 'node_1_2');
    elm.cancelEvent();
    return result.success === true;
  });

  test('EventLevelManager 事件追踪功能正常', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var elm = dm.getEventLevelManager();
    var sdm = dm.getSeasonDataManager();
    sdm.setCurrentChapter('chapter_1');
    elm.initializeEvent('chapter_1', 'node_1_3');
    elm.trackEvent('damage', { amount: 10, damageType: 'rock' });
    var ctx = elm.getEventContext();
    elm.cancelEvent();
    return ctx && ctx.tracking.damageTaken === 10;
  });

  // ===== RewardSystem 测试 =====
  test('DataManager 可获取 RewardSystem', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var rs = dm.getRewardSystem();
    return typeof rs !== 'undefined' && rs !== null;
  });

  test('RewardSystem 可获取节点奖励预览', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var rs = dm.getRewardSystem();
    var preview = rs.getNodeRewardsPreview('chapter_1', 'node_1_1');
    return preview && preview.coins === 200;
  });

  test('RewardSystem 可获取章节奖励预览', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var rs = dm.getRewardSystem();
    var preview = rs.getChapterRewardsPreview('chapter_1');
    return preview && typeof preview.coins === 'number';
  });

  test('RewardSystem 可计算成长进度', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var rs = dm.getRewardSystem();
    var growth = rs.calculateGrowthProgress();
    return growth && typeof growth.overallGrowth === 'number';
  });

  test('RewardSystem 可初始化赛季比赛', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var rs = dm.getRewardSystem();
    var sdm = dm.getSeasonDataManager();
    sdm.setCurrentChapter('chapter_1');
    var result = rs.initializeSeasonRace('chapter_1', 'node_1_1');
    sdm.clearRunContext();
    return result.success === true && result.mode === 'season_race';
  });

  // ===== CarGrowthSystem 测试 =====
  test('DataManager 可获取 CarGrowthSystem', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var cgs = dm.getCarGrowthSystem();
    return typeof cgs !== 'undefined' && cgs !== null;
  });

  test('CarGrowthSystem 可获取成长统计', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var cgs = dm.getCarGrowthSystem();
    var stats = cgs.getGrowthStats();
    return stats && typeof stats.currentPerformance === 'number';
  });

  test('CarGrowthSystem 可获取推荐升级', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var cgs = dm.getCarGrowthSystem();
    var rec = cgs.getRecommendedUpgrades('chapter_1');
    return rec && typeof rec.ready === 'boolean';
  });

  test('CarGrowthSystem 可获取章节解锁提示', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var cgs = dm.getCarGrowthSystem();
    var hints = cgs.getChapterUnlockHints('chapter_2');
    return hints && Array.isArray(hints.requirements);
  });

  test('CarGrowthSystem 可获取节点解锁提示', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var cgs = dm.getCarGrowthSystem();
    var hints = cgs.getNodeUnlockHints('chapter_1', 'node_1_1');
    return hints && typeof hints.unlocked === 'boolean';
  });

  test('CarGrowthSystem 可获取成长里程碑', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var cgs = dm.getCarGrowthSystem();
    var milestones = cgs.getGrowthMilestones();
    return milestones && Array.isArray(milestones.milestones);
  });

  test('CarGrowthSystem 可获取性能曲线', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var cgs = dm.getCarGrowthSystem();
    var curve = cgs.getPowerCurve();
    return curve && Array.isArray(curve.categories) && curve.categories.length === 6;
  });

  // ===== 数据持久化测试 =====
  test('节点进度更新正常', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    var runResult = {
      isComplete: true,
      score: 5000,
      time: 80,
      stars: 2,
      distance: 8000
    };
    var result = sdm.updateNodeProgress('chapter_1', 'node_1_1', runResult);
    return result.success === true && result.firstClear === true;
  });

  test('节点通关后可解锁后续节点', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    var unlocked1_2 = sdm.isNodeUnlocked('chapter_1', 'node_1_2');
    var unlocked1_3 = sdm.isNodeUnlocked('chapter_1', 'node_1_3');
    return unlocked1_2 === true && unlocked1_3 === true;
  });

  test('赛季总结数据正确', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    var summary = sdm.getSeasonSummary();
    return summary && summary.totalStars >= 2 && summary.chapters.length === 3;
  });

  // ===== 赛季等级升级测试 =====
  test('赛季等级升级正常触发', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var sdm = dm.getSeasonDataManager();
    var beforeLevel = sdm.getSeasonLevel();
    sdm.addSeasonXP(2000, 'level_up_test');
    var afterLevel = sdm.getSeasonLevel();
    return afterLevel > beforeLevel;
  });

  // ===== 赛季模式奖励处理测试 =====
  test('常规比赛奖励处理流程正常', function() {
    var dm = MountainRacer.DataManager.getInstance();
    var rs = dm.getRewardSystem();
    var sdm = dm.getSeasonDataManager();

    sdm.setCurrentChapter('chapter_1');
    sdm.setRunContext({
      mode: 'season_race',
      chapterId: 'chapter_1',
      nodeId: 'node_1_4',
      nodeType: 'race'
    });

    var runStats = {
      isComplete: true,
      totalScore: 8000,
      time: 60,
      distance: 10000,
      health: 90,
      perfectRun: false
    };
    var starRating = { stars: 2 };

    var result = rs.processGameRunRewards(runStats, starRating, true);
    return result && result.success === true && result.isRace === true;
  });

  // ===== 运行测试 =====
  var result = runTests();
  window.__seasonCareerTestResult = result;

  if (result.failed === 0) {
    console.log('🎉 所有赛季生涯模式模块测试通过！');
  } else {
    console.log('⚠️ 有 ' + result.failed + ' 个测试失败，请检查。');
  }
})();
