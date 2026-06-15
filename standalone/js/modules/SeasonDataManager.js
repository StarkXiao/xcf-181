(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.SeasonDataManager = function(dataManager) {
    this._dm = dataManager;
  };

  var proto = MountainRacer.SeasonDataManager.prototype;

  proto._getSeasonData = function() {
    return this._dm.getData('season', null);
  };

  proto._setSeasonData = function(path, value) {
    this._dm.setData('season.' + path, value);
  };

  proto.getCurrentSeason = function() {
    var seasonId = this._dm.getData('season.currentSeason', null);
    return seasonId ? MountainRacer.SeasonConfig.getSeason(seasonId) : null;
  };

  proto.setCurrentSeason = function(seasonId) {
    var season = MountainRacer.SeasonConfig.getSeason(seasonId);
    if (!season) return { success: false, reason: 'invalid_season' };
    if (!this.isSeasonUnlocked(seasonId)) {
      return { success: false, reason: 'season_locked' };
    }
    this._setSeasonData('currentSeason', seasonId);
    this._dm._emit('seasonChanged', { seasonId: seasonId, season: season });
    return { success: true };
  };

  proto.getCurrentChapter = function() {
    var chapterId = this._dm.getData('season.currentChapter', null);
    return chapterId ? MountainRacer.SeasonConfig.getChapter(chapterId) : null;
  };

  proto.setCurrentChapter = function(chapterId) {
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter) return { success: false, reason: 'invalid_chapter' };
    if (!this.isChapterUnlocked(chapterId)) {
      return { success: false, reason: 'chapter_locked' };
    }
    this._setSeasonData('currentChapter', chapterId);
    var startNode = MountainRacer.SeasonConfig.getChapterStartNode(chapterId);
    if (startNode) {
      this._setSeasonData('currentNode', startNode.id);
    }
    this._dm._emit('chapterChanged', { chapterId: chapterId, chapter: chapter });
    return { success: true };
  };

  proto.getCurrentNode = function() {
    var nodeId = this._dm.getData('season.currentNode', null);
    if (!nodeId) return null;
    var chapter = this.getCurrentChapter();
    if (!chapter) return null;
    return MountainRacer.SeasonConfig.getNode(chapter.id, nodeId);
  };

  proto.setCurrentNode = function(nodeId) {
    var chapter = this.getCurrentChapter();
    if (!chapter) return { success: false, reason: 'no_active_chapter' };
    var node = MountainRacer.SeasonConfig.getNode(chapter.id, nodeId);
    if (!node) return { success: false, reason: 'invalid_node' };
    if (!this.isNodeUnlocked(chapter.id, nodeId)) {
      return { success: false, reason: 'node_locked' };
    }
    this._setSeasonData('currentNode', nodeId);
    this._dm._emit('nodeChanged', { chapterId: chapter.id, nodeId: nodeId, node: node });
    return { success: true };
  };

  proto.getSeasonXP = function() {
    return this._dm.getData('season.seasonXP', 0);
  };

  proto.getSeasonLevel = function() {
    return this._dm.getData('season.seasonLevel', 1);
  };

  proto.addSeasonXP = function(amount, reason) {
    if (amount <= 0) return { added: 0, leveledUp: false, newLevel: null };
    var currentXP = this.getSeasonXP();
    var currentLevel = this.getSeasonLevel();
    var newXP = currentXP + amount;
    var newLevelData = MountainRacer.SeasonConfig.getSeasonLevelByXP(newXP);
    var newLevel = newLevelData ? newLevelData.level : currentLevel;
    var leveledUp = newLevel > currentLevel;
    var levelUps = [];

    if (leveledUp) {
      for (var lv = currentLevel + 1; lv <= newLevel; lv++) {
        var levelConfig = MountainRacer.SeasonConfig.getSeasonLevel(lv);
        if (levelConfig) {
          levelUps.push({ level: lv, reward: levelConfig.reward || {} });
        }
      }
    }

    var playStats = this._dm.getData('season.playStats', {});
    playStats.totalSeasonXPEarned = (playStats.totalSeasonXPEarned || 0) + amount;
    this._setSeasonData('playStats', playStats);

    this._dm.batchUpdate({
      'season.seasonXP': newXP,
      'season.seasonLevel': newLevel
    });

    this._dm._emit('seasonXPAdded', {
      amount: amount,
      reason: reason || 'unknown',
      totalXP: newXP,
      previousXP: currentXP
    });

    if (leveledUp) {
      this._dm._emit('seasonLevelUp', {
        newLevel: newLevel,
        oldLevel: currentLevel,
        levelUps: levelUps,
        totalXP: newXP
      });
    }

    return {
      added: amount,
      totalXP: newXP,
      leveledUp: leveledUp,
      newLevel: newLevel,
      oldLevel: currentLevel,
      levelUps: levelUps
    };
  };

  proto.getSeasonLevelProgress = function() {
    var xp = this.getSeasonXP();
    var currentLevel = MountainRacer.SeasonConfig.getSeasonLevelByXP(xp);
    var nextLevelXP = MountainRacer.SeasonConfig.getNextLevelXP(xp);
    var currentLevelStart = currentLevel ? currentLevel.xpRequired : 0;
    var progressInLevel = xp - currentLevelStart;
    var requiredForNext = nextLevelXP - currentLevelStart;
    var percent = requiredForNext > 0 ? (progressInLevel / requiredForNext) * 100 : 100;
    return {
      xp: xp,
      level: currentLevel ? currentLevel.level : 1,
      title: currentLevel ? currentLevel.title : '新秀车手',
      currentLevelStart: currentLevelStart,
      nextLevelXP: nextLevelXP,
      progressInLevel: progressInLevel,
      requiredForNext: requiredForNext,
      percent: Math.min(100, Math.floor(percent))
    };
  };

  proto.isSeasonUnlocked = function(seasonId) {
    var unlocked = this._dm.getData('season.unlockedSeasons', []);
    return unlocked.indexOf(seasonId) !== -1;
  };

  proto.unlockSeason = function(seasonId) {
    if (!MountainRacer.SeasonConfig.getSeason(seasonId)) {
      return { success: false, reason: 'invalid_season' };
    }
    if (this.isSeasonUnlocked(seasonId)) {
      return { success: false, reason: 'already_unlocked' };
    }
    var unlocked = this._dm.getData('season.unlockedSeasons', []);
    unlocked.push(seasonId);
    this._setSeasonData('unlockedSeasons', unlocked);
    this._dm._emit('seasonUnlocked', { seasonId: seasonId });
    return { success: true };
  };

  proto.isChapterUnlocked = function(chapterId) {
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter) return false;
    var unlocked = this._dm.getData('season.unlockedChapters', []);
    if (unlocked.indexOf(chapterId) !== -1) return true;
    var totalStars = this.getTotalStars();
    var requiredStars = chapter.unlockStars || 0;
    if (requiredStars > 0 && totalStars >= requiredStars) {
      var garageMgr = this._dm.getGarageManager();
      var currentPower = garageMgr.getCurrentPerformanceRating();
      var requiredPower = chapter.requiredPower || 0;
      if (currentPower >= requiredPower) {
        this.unlockChapter(chapterId);
        return true;
      }
    }
    return false;
  };

  proto.unlockChapter = function(chapterId) {
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter) return { success: false, reason: 'invalid_chapter' };
    if (this.isChapterUnlocked(chapterId)) {
      return { success: false, reason: 'already_unlocked' };
    }
    var unlocked = this._dm.getData('season.unlockedChapters', []);
    unlocked.push(chapterId);
    this._setSeasonData('unlockedChapters', unlocked);
    var startNode = MountainRacer.SeasonConfig.getChapterStartNode(chapterId);
    if (startNode) {
      var unlockedNodes = this._dm.getData('season.unlockedNodes', {});
      unlockedNodes[chapterId] = unlockedNodes[chapterId] || [];
      if (unlockedNodes[chapterId].indexOf(startNode.id) === -1) {
        unlockedNodes[chapterId].push(startNode.id);
      }
      this._setSeasonData('unlockedNodes', unlockedNodes);
    }
    this._dm._emit('chapterUnlocked', { chapterId: chapterId, chapter: chapter });
    return { success: true };
  };

  proto.isNodeUnlocked = function(chapterId, nodeId) {
    var unlockedNodes = this._dm.getData('season.unlockedNodes', {});
    var chapterNodes = unlockedNodes[chapterId] || [];
    return chapterNodes.indexOf(nodeId) !== -1;
  };

  proto.unlockNode = function(chapterId, nodeId) {
    var node = MountainRacer.SeasonConfig.getNode(chapterId, nodeId);
    if (!node) return { success: false, reason: 'invalid_node' };
    if (this.isNodeUnlocked(chapterId, nodeId)) {
      return { success: false, reason: 'already_unlocked' };
    }
    var unlockedNodes = this._dm.getData('season.unlockedNodes', {});
    unlockedNodes[chapterId] = unlockedNodes[chapterId] || [];
    unlockedNodes[chapterId].push(nodeId);
    this._setSeasonData('unlockedNodes', unlockedNodes);
    this._dm._emit('nodeUnlocked', { chapterId: chapterId, nodeId: nodeId, node: node });
    return { success: true };
  };

  proto.checkNodeUnlockRequirement = function(chapterId, node) {
    if (!node || !node.unlockRequirement) return true;
    var req = node.unlockRequirement;

    switch (req.type) {
      case 'node_clear':
        var nodeProg = this.getNodeProgress(chapterId, req.nodeId);
        if (!nodeProg || !nodeProg.cleared) return false;
        if (req.minStars) {
          var stars = this.getStarsForNode(chapterId, req.nodeId);
          if (stars < req.minStars) return false;
        }
        return true;
      case 'any_node_clear':
        if (!req.nodeIds || req.nodeIds.length === 0) return false;
        var anyCleared = false;
        for (var i = 0; i < req.nodeIds.length; i++) {
          var np = this.getNodeProgress(chapterId, req.nodeIds[i]);
          if (np && np.cleared) {
            anyCleared = true;
            break;
          }
        }
        if (!anyCleared) return false;
        if (req.minStars) {
          var totalStars = 0;
          for (var j = 0; j < req.nodeIds.length; j++) {
            totalStars += this.getStarsForNode(chapterId, req.nodeIds[j]);
          }
          if (totalStars < req.minStars) return false;
        }
        return true;
      case 'chapter_complete':
        return this.isChapterComplete(req.chapterId);
      case 'season_level':
        return this.getSeasonLevel() >= (req.level || 1);
      case 'star_count':
        return this.getTotalStars() >= (req.stars || 0);
      default:
        return true;
    }
  };

  proto.getNodeProgress = function(chapterId, nodeId) {
    var progress = this._dm.getData('season.nodeProgress', {});
    var chapterProgress = progress[chapterId] || {};
    return chapterProgress[nodeId] || { cleared: false, attempts: 0, bestScore: 0, bestTime: null, stars: 0, isComplete: false };
  };

  proto.updateNodeProgress = function(chapterId, nodeId, runResult) {
    var progress = this._dm.getData('season.nodeProgress', {});
    var node = MountainRacer.SeasonConfig.getNode(chapterId, nodeId);
    if (!node) return { success: false, reason: 'invalid_node' };

    if (!progress[chapterId]) progress[chapterId] = {};
    var prevProg = progress[chapterId][nodeId] || { cleared: false, attempts: 0, bestScore: 0, bestTime: null, stars: 0, isComplete: false };
    var newProg = {
      isComplete: prevProg.isComplete || !!runResult.isComplete,
      cleared: prevProg.cleared || !!runResult.isComplete,
      attempts: prevProg.attempts + 1,
      bestScore: Math.max(prevProg.bestScore, runResult.score || 0),
      bestTime: prevProg.bestTime === null || (runResult.time && runResult.time < prevProg.bestTime) ?
        (runResult.time || prevProg.bestTime) : prevProg.bestTime,
      stars: Math.max(prevProg.stars || 0, runResult.stars || 0),
      lastRun: runResult,
      firstClearAt: prevProg.cleared ? prevProg.firstClearAt : (runResult.isComplete ? Date.now() : null),
      lastRunAt: Date.now()
    };

    progress[chapterId][nodeId] = newProg;
    this._setSeasonData('nodeProgress', progress);

    var playStats = this._dm.getData('season.playStats', {});
    playStats.totalRuns = (playStats.totalRuns || 0) + 1;
    if (runResult.isComplete) {
      playStats.totalWins = (playStats.totalWins || 0) + 1;
    }
    playStats.totalDistance = (playStats.totalDistance || 0) + (runResult.distance || 0);
    if (!playStats.bestScorePerNode) playStats.bestScorePerNode = {};
    if (!playStats.bestScorePerNode[chapterId]) playStats.bestScorePerNode[chapterId] = {};
    playStats.bestScorePerNode[chapterId][nodeId] = Math.max(playStats.bestScorePerNode[chapterId][nodeId] || 0, runResult.score || 0);
    if (!playStats.bestTimePerNode) playStats.bestTimePerNode = {};
    if (!playStats.bestTimePerNode[chapterId]) playStats.bestTimePerNode[chapterId] = {};
    if (runResult.time) {
      playStats.bestTimePerNode[chapterId][nodeId] = playStats.bestTimePerNode[chapterId][nodeId] === null ||
        runResult.time < playStats.bestTimePerNode[chapterId][nodeId] ? runResult.time : playStats.bestTimePerNode[chapterId][nodeId];
    }
    this._setSeasonData('playStats', playStats);

    var wasCleared = prevProg.cleared;
    this._dm._emit('nodeProgressUpdated', {
      chapterId: chapterId,
      nodeId: nodeId,
      progress: newProg,
      firstClear: newProg.cleared && !wasCleared
    });

    if (newProg.cleared && !wasCleared) {
      this._unlockNextNodes(chapterId, node, node.nextNodes);
    }

    return {
      success: true,
      progress: newProg,
      firstClear: newProg.cleared && !wasCleared,
      starsImproved: (runResult.stars || 0) > (prevProg.stars || 0),
      scoreImproved: (runResult.score || 0) > prevProg.bestScore
    };
  };

  proto._unlockNextNodes = function(chapterId, currentNode, nextNodeIds) {
    if (!nextNodeIds || nextNodeIds.length === 0) return;
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter) return;

    for (var i = 0; i < nextNodeIds.length; i++) {
      var nextNodeId = nextNodeIds[i];
      var nextNode = MountainRacer.SeasonConfig.getNode(chapterId, nextNodeId);
      if (!nextNode) continue;
      if (this.isNodeUnlocked(chapterId, nextNodeId)) continue;
      if (!this.checkNodeUnlockRequirement(chapterId, nextNode)) continue;
      this.unlockNode(chapterId, nextNodeId);
    }
  };

  proto.getStarsForNode = function(chapterId, nodeId) {
    var progress = this.getNodeProgress(chapterId, nodeId);
    return progress.stars || 0;
  };

  proto.getTotalStars = function() {
    var progress = this._dm.getData('season.nodeProgress', {});
    var total = 0;
    var chapterIds = Object.keys(progress);
    for (var i = 0; i < chapterIds.length; i++) {
      var chapterProgress = progress[chapterIds[i]];
      var nodeIds = Object.keys(chapterProgress);
      for (var j = 0; j < nodeIds.length; j++) {
        total += (chapterProgress[nodeIds[j]].stars || 0);
      }
    }
    return total;
  };

  proto.getChapterStars = function(chapterId) {
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter) return { total: 0, earned: 0, maxPerNode: 3 };
    var nodes = chapter.nodes;
    var earned = 0;
    var total = 0;
    for (var i = 0; i < nodes.length; i++) {
      total += (nodes[i].rewards && nodes[i].rewards.stars) || 3;
      earned += this.getStarsForNode(chapterId, nodes[i].id);
    }
    return { total: total, earned: earned, maxPerNode: 3, percent: total > 0 ? Math.floor((earned / total) * 100) : 0 };
  };

  proto.isChapterComplete = function(chapterId) {
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter) return false;
    var progress = this._dm.getData('season.chapterProgress', {});
    if (progress[chapterId] && progress[chapterId].completed) return true;
    var endNodes = MountainRacer.SeasonConfig.getChapterEndNodes(chapterId);
    for (var i = 0; i < endNodes.length; i++) {
      var nodeProg = this.getNodeProgress(chapterId, endNodes[i].id);
      if (nodeProg.cleared) {
        this._markChapterComplete(chapterId);
        return true;
      }
    }
    return false;
  };

  proto._markChapterComplete = function(chapterId) {
    var progress = this._dm.getData('season.chapterProgress', {});
    if (progress[chapterId] && progress[chapterId].completed) return;
    progress[chapterId] = {
      completed: true,
      completedAt: Date.now(),
      stars: this.getChapterStars(chapterId).earned
    };
    this._setSeasonData('chapterProgress', progress);
    this._dm._emit('chapterComplete', { chapterId: chapterId, progress: progress[chapterId] });
    this._unlockNextChapter(chapterId);
  };

  proto._unlockNextChapter = function(chapterId) {
    var season = this.getCurrentSeason();
    if (!season) return;
    var chapters = MountainRacer.SeasonConfig.getChaptersBySeason(season.id);
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].id === chapterId && i < chapters.length - 1) {
        var nextChapter = chapters[i + 1];
        if (!this.isChapterUnlocked(nextChapter.id)) {
          var totalStars = this.getTotalStars();
          var requiredStars = nextChapter.unlockStars || 0;
          var garageMgr = this._dm.getGarageManager();
          var currentPower = garageMgr.getCurrentPerformanceRating();
          var requiredPower = nextChapter.requiredPower || 0;
          if (totalStars >= requiredStars && currentPower >= requiredPower) {
            this.unlockChapter(nextChapter.id);
          }
        }
        break;
      }
    }
  };

  proto.isSeasonComplete = function(seasonId) {
    var sid = seasonId || this._dm.getData('season.currentSeason', null);
    if (!sid) return false;
    var progress = this._dm.getData('season.seasonProgress', {});
    if (progress[sid] && progress[sid].completed) return true;
    var season = MountainRacer.SeasonConfig.getSeason(sid);
    if (!season) return false;
    for (var i = 0; i < season.chapters.length; i++) {
      if (!this.isChapterComplete(season.chapters[i])) return false;
    }
    progress[sid] = { completed: true, completedAt: Date.now(), stars: this.getTotalStars() };
    this._setSeasonData('seasonProgress', progress);
    this._dm._emit('seasonComplete', { seasonId: sid, progress: progress[sid] });
    return true;
  };

  proto.getChapterProgress = function(chapterId) {
    var progress = this._dm.getData('season.chapterProgress', {});
    return progress[chapterId] || { completed: false };
  };

  proto.getClaimedRewards = function() {
    return this._dm.getData('season.claimedRewards', { seasonLevels: [], chapters: [], nodes: [] });
  };

  proto.isRewardClaimed = function(type, id) {
    var claimed = this.getClaimedRewards();
    var arr = claimed[type] || [];
    return arr.indexOf(id) !== -1;
  };

  proto.markRewardClaimed = function(type, id) {
    var claimed = this.getClaimedRewards();
    claimed[type] = claimed[type] || [];
    if (claimed[type].indexOf(id) === -1) {
      claimed[type].push(id);
      this._setSeasonData('claimedRewards', claimed);
      this._dm._emit('rewardClaimed', { type: type, id: id });
    }
  };

  proto.getPlayStats = function() {
    return this._dm.getData('season.playStats', {});
  };

  proto.getSeasonSummary = function() {
    var season = this.getCurrentSeason();
    if (!season) return null;
    var chapters = [];
    var totalStars = 0;
    var totalMaxStars = 0;
    var completedNodes = 0;
    var totalNodes = 0;
    var completedChapters = 0;
    for (var i = 0; i < season.chapters.length; i++) {
      var chId = season.chapters[i];
      var ch = MountainRacer.SeasonConfig.getChapter(chId);
      var chStars = this.getChapterStars(chId);
      var chProg = this.getChapterProgress(chId);
      totalStars += chStars.earned;
      totalMaxStars += chStars.total;
      if (ch && ch.nodes) {
        totalNodes += ch.nodes.length;
      }
      var chCompleted = this.isChapterComplete(chId);
      if (chCompleted) completedChapters++;
      var nodeProgress = this._dm.getData('season.nodeProgress.' + chId, {});
      for (var nid in nodeProgress) {
        if (nodeProgress[nid] && nodeProgress[nid].isComplete) completedNodes++;
      }
      chapters.push({
        id: chId,
        config: ch,
        stars: chStars,
        progress: chProg,
        unlocked: this.isChapterUnlocked(chId),
        isComplete: chCompleted
      });
    }
    var levelProg = this.getSeasonLevelProgress();
    return {
      season: season,
      chapters: chapters,
      totalStars: totalStars,
      maxStars: totalMaxStars,
      completedNodes: completedNodes,
      totalNodes: totalNodes,
      completedChapters: completedChapters,
      completionPercent: totalMaxStars > 0 ? Math.floor((totalStars / totalMaxStars) * 100) : 0,
      isComplete: this.isSeasonComplete(season.id),
      level: levelProg
    };
  };

  proto.getNextRecommendedNode = function() {
    var season = this.getCurrentSeason();
    if (!season) return null;
    for (var i = 0; i < season.chapters.length; i++) {
      var chId = season.chapters[i];
      if (!this.isChapterUnlocked(chId)) continue;
      var chapter = MountainRacer.SeasonConfig.getChapter(chId);
      if (!chapter || !chapter.nodes) continue;
      for (var j = 0; j < chapter.nodes.length; j++) {
        var node = chapter.nodes[j];
        if (!this.isNodeComplete(chId, node.id) && this.isNodeUnlocked(chId, node.id)) {
          return {
            chapter: chapter,
            node: node,
            chapterId: chId,
            nodeId: node.id
          };
        }
      }
      if (!this.isChapterComplete(chId)) {
        var startNode = MountainRacer.SeasonConfig.getChapterStartNode(chId);
        if (startNode) {
          return {
            chapter: chapter,
            node: startNode,
            chapterId: chId,
            nodeId: startNode.id
          };
        }
      }
    }
    return null;
  };

  proto.isNodeComplete = function(chapterId, nodeId) {
    var progress = this._dm.getData('season.nodeProgress.' + chapterId + '.' + nodeId, null);
    return !!(progress && progress.isComplete);
  };

  proto.setRunContext = function(context) {
    this._setSeasonData('currentRunContext', context || null);
  };

  proto.getRunContext = function() {
    return this._dm.getData('season.currentRunContext', null);
  };

  proto.clearRunContext = function() {
    this._setSeasonData('currentRunContext', null);
  };

  proto.resetSeasonProgress = function(keepXP) {
    this._dm.batchUpdate({
      'season.currentChapter': null,
      'season.currentNode': null,
      'season.seasonXP': keepXP ? this.getSeasonXP() : 0,
      'season.seasonLevel': keepXP ? this.getSeasonLevel() : 1,
      'season.unlockedChapters': ['chapter_1'],
      'season.unlockedNodes': { chapter_1: ['node_1_1'] },
      'season.nodeProgress': {},
      'season.chapterProgress': {},
      'season.seasonProgress': {},
      'season.claimedRewards': { seasonLevels: [], chapters: [], nodes: [] },
      'season.currentRunContext': null
    });
    var startNode = MountainRacer.SeasonConfig.getChapterStartNode('chapter_1');
    if (startNode) {
      this._setSeasonData('currentNode', startNode.id);
    }
    this._dm._emit('seasonProgressReset', { keepXP: !!keepXP });
  };

  window.MountainRacer = MountainRacer;
})();
