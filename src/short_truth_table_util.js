import Logic from './class_definition.js';

Logic.prototype.forEach = function(callback) {
  let nodes = [this];
  while (nodes.length > 0) {
    let node = nodes.shift();
    callback(node);
    nodes = nodes.concat(node.children);
  }
};

Logic.prototype.length = function() {
  let num = 0;
  this.forEach(node => {
    num += 1;
  });
  return num;
};

Logic.prototype.nthNode = function(n) {
  let nodes = [this];
  let current = -1;
  let node;
  while (current < n) {
    current += 1;
    node = nodes.shift();
    if (node.children) {
      nodes = nodes.concat(node.children);
    }
  }
  return node;
};

Logic.prototype.root = function() {
  let root = this;
  while (root.parent) {
    root = root.parent;
  }
  return root;
};

Logic.prototype.findIdx = function(str) {
  const length = this.length();
  for (let i = 0; i < length; i++) {
    if (this.nthNode(i).stringify() === str) {
      return i;
    }
  }
};

Logic.prototype.supposeTrue = function() {
  let model = {
    [this.stringify()]: { truthValue: true },
    t: { truthValue: true },
    f: { truthValue: false },
  };
  const length = this.length();
  let i = 0;
  while (i < length) {
    let node = this.nthNode(i);
    let nodeString = node.stringify();
    let nodeValueInModel;
    if (model[nodeString] !== undefined) {
      nodeValueInModel = model[nodeString].truthValue;
    }
    if (typeof nodeValueInModel === 'boolean') {
      if (node.value === 'N') {
        handleNegation(node, nodeValueInModel);
      } else if (node.value === 'O') {
        handleDisjunction(node, nodeValueInModel, nodeString);
      }
    }
    i++;
  }
  return model;

  function handleNegation(node, nodeValueInModel) {
    let negatumString = node.children[0].stringify();
    let negatumValueInModel;
    if (model[negatumString] !== undefined) {
      negatumValueInModel = model[negatumString].truthValue;
    }
    if (negatumValueInModel === nodeValueInModel) {
      i = handleInconsistency(node) - 1;
      if (isNaN(i)) {
        return;
      }
    } else if (negatumValueInModel === undefined) {
      model[negatumString] = { truthValue: !nodeValueInModel };
    }
  }

  function handleDisjunction(node, nodeValueInModel, nodeString) {
    let firstDisjunctString = node.children[0].stringify();
    let secondDisjunctString = node.children[1].stringify();
    let firstDisjunctValueInModel;
    if (model[firstDisjunctString] !== undefined) {
      firstDisjunctValueInModel = model[firstDisjunctString].truthValue;
    }
    let secondDisjunctValueInModel;
    if (model[secondDisjunctString] !== undefined) {
      secondDisjunctValueInModel = model[secondDisjunctString].truthValue;
    }
    let nodeOpenPossibilities;
    if (model[nodeString] !== undefined) {
      nodeOpenPossibilities = model[nodeString].openPossibilities;
    }
    if (!nodeValueInModel) {
      handleNodeFalse(node, nodeValueInModel, nodeOpenPossibilities);
    } else {
      if (
        firstDisjunctValueInModel === false &&
        secondDisjunctValueInModel === false
      ) {
        i = handleInconsistency(node) - 1;
        if (isNaN(i)) {
          return;
        }
      } else if (
        firstDisjunctValueInModel === false &&
        secondDisjunctValueInModel === undefined
      ) {
        model[secondDisjunctValueInModel] = { truthValue: true };
      } else if (
        firstDisjunctValueInModel === undefined &&
        secondDisjunctValueInModel === false
      ) {
        model[firstDisjunctValueInModel] = { truthValue: true };
      } else if (
        firstDisjunctValueInModel === true &&
        secondDisjunctValueInModel === undefined
      ) {
        handleTrueUndef(
          node,
          nodeValueInModel,
          nodeOpenPossibilities,
          nodeString
        );
      } else if (
        firstDisjunctValueInModel === undefined &&
        secondDisjunctValueInModel === true
      ) {
        handleUndefTrue(
          node,
          nodeValueInModel,
          nodeOpenPossibilities,
          nodeString
        );
      } else if (
        firstDisjunctValueInModel === undefined &&
        secondDisjunctValueInModel === undefined
      ) {
        node.openPossibilities = [[true, true]];
        nodeOpenPossibilities = node.openPossibilities;
        handleUndefUndef(
          node,
          nodeValueInModel,
          nodeOpenPossibilities,
          nodeString
        );
      }
    }

    function handleNodeFalse(node, nodeValueInModel, nodeOpenPossibilities) {
      if (
        firstDisjunctValueInModel === true ||
        secondDisjunctValueInModel === true
      ) {
        i = handleInconsistency(node) - 1;
        if (isNaN(i)) {
          return;
        }
      } else {
        model[firstDisjunctString] = { truthValue: false };
        model[secondDisjunctString] = { truthValue: false };
      }
    }

    function handleTrueUndef(
      node,
      nodeValueInModel,
      nodeOpenPossibilities,
      nodeString
    ) {
      if (
        nodeOpenPossibilities &&
        nodeOpenPossibilities.includes([true, true])
      ) {
        let currentPossibilityIdx = nodeOpenPossibilities.indexOf([true, true]);
        nodeOpenPossibilities.slice(currentPossibilityIdx, 1);
        nodeOpenPossibilities.push([true, false]);
        model[nodeString].snapshot = merge({}, model);
        model[secondDisjunctValueInModel] = { truthValue: true };
      } else if (
        nodeOpenPossibilities &&
        nodeOpenPossibilities.includes([true, false])
      ) {
        let currentPossibilityIdx = nodeOpenPossibilities.indexOf([
          true,
          false,
        ]);
        nodeOpenPossibilities.slice(currentPossibilityIdx, 1);
        model[nodeString].snapshot = merge({}, model);
        model[secondDisjunctValueInModel] = { truthValue: false };
      } else {
        i = handleInconsistency(node) - 1;
        if (isNaN(i)) {
          return;
        }
      }
    }

    function handleUndefTrue(
      node,
      nodeValueInModel,
      nodeOpenPossibilities,
      nodeString
    ) {
      if (
        nodeOpenPossibilities &&
        nodeOpenPossibilities.includes([true, true])
      ) {
        let currentPossibilityIdx = nodeOpenPossibilities.indexOf([true, true]);
        nodeOpenPossibilities.slice(currentPossibilityIdx, 1);
        nodeOpenPossibilities.push([false, true]);
        model[nodeString].snapshot = merge({}, model);
        model[firstDisjunctValueInModel] = { truthValue: true };
      } else if (
        nodeOpenPossibilities &&
        nodeOpenPossibilities.includes([false, true])
      ) {
        let currentPossibilityIdx = nodeOpenPossibilities.indexOf([
          true,
          false,
        ]);
        nodeOpenPossibilities.slice(currentPossibilityIdx, 1);
        model[nodeString].snapshot = merge({}, model);
        model[firstDisjunctValueInModel] = { truthValue: false };
      } else {
        i = handleInconsistency(node) - 1;
        if (isNaN(i)) {
          return;
        }
      }
    }
    // TODO: Logic._parse('1O2').supposeTrue() doesn't return a model with values for 1 and 2

    function handleUndefUndef(
      node,
      nodeValueInModel,
      nodeOpenPossibilities,
      nodeString
    ) {
      if (
        nodeOpenPossibilities &&
        nodeOpenPossibilities.includes([true, true])
      ) {
        let currentPossibilityIdx = nodeOpenPossibilities.indexOf([true, true]);
        nodeOpenPossibilities.slice(currentPossibilityIdx, 1);
        nodeOpenPossibilities.push([true, false]);
        nodeOpenPossibilities.push([false, true]);
        model[nodeString].snapshot = merge({}, model);
        model[firstDisjunctValueInModel] = { truthValue: true };
        model[secondDisjunctValueInModel] = { truthValue: true };
      } else if (
        nodeOpenPossibilities &&
        nodeOpenPossibilities.includes([true, false])
      ) {
        let currentPossibilityIdx = nodeOpenPossibilities.indexOf([
          true,
          false,
        ]);
        nodeOpenPossibilities.slice(currentPossibilityIdx, 1);
        model[nodeString].snapshot = merge({}, model);
        model[firstDisjunctValueInModel] = { truthValue: true };
        model[secondDisjunctValueInModel] = { truthValue: false };
      } else if (
        nodeOpenPossibilities &&
        nodeOpenPossibilities.includes([false, true])
      ) {
        let currentPossibilityIdx = nodeOpenPossibilities.indexOf([
          false,
          true,
        ]);
        nodeOpenPossibilities.slice(currentPossibilityIdx, 1);
        model[nodeString].snapshot = merge({}, model);
        model[firstDisjunctValueInModel] = { truthValue: false };
        model[secondDisjunctValueInModel] = { truthValue: true };
      } else {
        i = handleInconsistency(node) - 1;
        if (isNaN(i)) {
          return;
        }
      }
    }

    function handleInconsistency(node) {
      return findAncestorIdxWithOpenPossibilities(model, node);
    }

    function findAncestorIdxWithOpenPossibilities(model, node) {
      const closestAncestorString = findClosestAncestorStringWithOpenPossibilities(
        node
      );
      if (closestAncestorString) {
        return this.root().findIdx(closestAncestorString);
      }
    }

    function findClosestAncestorStringWithOpenPossibilities(node) {
      let parent = node;
      while (true) {
        if (!parent) {
          return;
        } else {
          if (parent.value === 'O') {
            let parentString = parent.stringify();
            let parentValueInModel = model[parentString];
            if (!parentValueInModel) {
              parent = parent.parent;
            } else if (
              parentValueInModel.openPossibilities &&
              parentValueInModel.openPossibilities.length > 0
            ) {
              return parentString;
            } else {
              parent = parent.parent;
            }
          } else {
            parent = parent.parent;
          }
        }
      }
    }
  }
};

export default Logic;