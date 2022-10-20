var sw = window.innerWidth
var sh = window.innerHeight
var forest = []

var D = {
  DEBUG: true,

  PROB_NEXT: 0.80,
  PROB_BRANCH: 0.3, 
  MAX_DEPTH: 20,
  
  MAX_BRANCH_SIZE: 30, 
  MIN_BRANCH_SIZE: 5,

  MAX_BRANCH_LENGTH: 50,
  MIN_BRANCH_LENGTH: 10,

  MIN_NUM_LEAFS: 1,
  MAX_NUM_LEAFS: 3,

  LEAF_SIZE: 30,
  LEAF_LENGTH: 30,

  VAR_BRANCH_ANGLE: Math.PI / 15,
  VAR_LEAF_ANGLE: Math.PI / 2,

  COLOR_BRANCH: "#9C2C77",
  COLOR_LEAF: "#FD841F",
  COLOR_DEBUG: "#ff4040",
}

var I = {} // inputs
var B = {} // buttons

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

class vec {
  constructor(x, y) {
      this.x = x
      this.y = y
  }

  plus(other) { return new vec(this.x + other.x, this.y + other.y) }
  minus(other) { return new vec(this.x - other.x, this.y - other.y) }
  times(other) { return new vec(this.x * other, this.y * other) }
  divide(other) { return new vec(this.x / other, this.y / other) }

  length() { return Math.sqrt(this.x * this.x, this.y * this.y) }
  
  rotate(ang) { return new vec(this.x * Math.cos(ang), this.y * Math.sin(ang)) }

  rotate(ang, from) { 
      const origin = this.minus(from);
      const rotated = origin.rotate(ang)
      return rotated.plus(from)
  }
}

class Branch {
  /**
   * Instanciate a new branch object
   * @param {number} ang relative angle from the parent angle
   * @param {number} len length of the branch
   * @param {number} size width of the branch
   * @param {string} color hex color of the branch
   * @param {[Branch | Leaf]} childs sub elements
   */
  constructor(ang, len, size, color, childs) {
    this.ang = ang
    this.len = len
    this.size = size
    this.color = color

    this.cang = ang // current angle
    this.vel = 0 // rotation velocity
    this.childs = childs // child branchs

    // compute max child depth
    this.depth = Math.max(...this.childs.map(e => 1 + e.depth), 1)
  }
    
  draw(pos, ang) {
    // console.log(pos.x, pos.y)
    const nang = ang + this.cang;

    const rot = new vec(Math.cos(nang), Math.sin(nang));
    const end = pos.plus(rot.times(this.len))

    const pos_tan = new vec(Math.sin(ang), -Math.cos(ang))
    const pos_left = pos.plus(pos_tan.times(this.size / 2))
    const pos_right = pos.minus(pos_tan.times(this.size / 2))
    
    const end_tan = new vec(Math.sin(nang), -Math.cos(nang))
    const end_left = end.plus(end_tan.times(this.size / 2))
    const end_right = end.minus(end_tan.times(this.size / 2))
    
    noStroke()
    fill(this.color);
    quad(pos_right.x, pos_right.y, pos_left.x, pos_left.y, end_left.x, end_left.y, end_right.x, end_right.y)

    if (D.DEBUG) {
      stroke(D.COLOR_DEBUG)
      line(pos.x, pos.y, end.x, end.y)
    }

    for (const child of this.childs) child.draw(end, nang)
  }
}

class Leaf {
    /**
     * Instanciate a new leaf object
     * @param {number} ang relative angle from the parent angle
     * @param {number} len length of the leaf
     * @param {number} size width of the leaf
     * @param {string} color hex color of the leaf
     */
  constructor(ang, len, size, color) {
    this.ang = ang
    this.len = len
    this.size = size
    this.color = color

    this.cang = ang // current angle
    this.vel = 0 // rotation velocity
    this.depth = 1 // max child depth
  }

  draw(pos, ang) {
    const nang = ang + this.cang;
    
    const rot = new vec(Math.cos(nang), Math.sin(nang))
    const end = pos.plus(rot.times(this.len))
    
    const tan = new vec(Math.sin(nang), -Math.cos(nang))
    const mid = pos.plus(end.minus(pos).divide(2))
    const left = mid.plus(tan.times(this.size / 2))
    const right = mid.minus(tan.times(this.size / 2))
    
    noStroke()
    fill(this.color);
    quad(pos.x, pos.y, left.x, left.y, end.x, end.y, right.x, right.y)

    if (D.DEBUG) {
      stroke(D.COLOR_DEBUG)
      line(pos.x, pos.y, end.x, end.y)
    }
  }
}

function Tree(depth) {    
  const rand_rotation = rand(-D.VAR_BRANCH_ANGLE, D.VAR_BRANCH_ANGLE)

  const childs = []

  const has_next = rand(0, 1) < D.PROB_NEXT

  if (depth < D.MAX_DEPTH && has_next) {
    // We draw one or several branches

    let has_branch = rand(0, 1) < D.PROB_BRANCH
    while (has_branch) {
      has_branch = rand(0, 1) < D.PROB_BRANCH
      childs.push(Tree(depth + 1))
    }
    
    childs.push(Tree(depth + 1))
  } else {
    // We must draw all leaves
    const num_leafs = rand(D.MIN_NUM_LEAFS, D.MAX_NUM_LEAFS)

    for (let i = 0; i < num_leafs; i++) {
      const rand_leaf = rand(-D.VAR_LEAF_ANGLE, D.VAR_LEAF_ANGLE)
      childs.push(new Leaf(rand_leaf, D.LEAF_LENGTH, D.LEAF_SIZE, D.COLOR_LEAF))
    }
  }

  const curr = new Branch(rand_rotation, 0, 0, D.COLOR_BRANCH, childs)
  
  const branch_size = D.MIN_BRANCH_SIZE + (D.MAX_BRANCH_SIZE - D.MIN_BRANCH_SIZE) * (1 - (D.MAX_DEPTH - curr.depth) / D.MAX_DEPTH)
  const branch_length = D.MIN_BRANCH_LENGTH + (D.MAX_BRANCH_LENGTH - D.MIN_BRANCH_LENGTH) * (1 - (D.MAX_DEPTH - curr.depth) / D.MAX_DEPTH)

  curr.size = branch_size
  curr.len = branch_length

  return curr
}

const LABELS_PADDING_X = 15
const LABELS_PADDING_Y = 25
const LABELS_SPACING = 20
const LABELS_LENGTH = 200

function inputs() {
  noStroke()
  fill("#000000")
  textSize(15)

  for (const [index, [key, value]] of Object.entries(Object.entries(D))) {
    switch (typeof value) {
      case 'number': {
        I[key] = createSlider(value / 2, value * 2, value, value / 100)
      } break
      case 'string': {
        I[key] = createColorPicker(value)
      } break
      case 'boolean': {
        I[key] = createCheckbox('', value)
      } break
      default: break
    }

    I[key].position(LABELS_LENGTH, LABELS_PADDING_Y - 13 + index * LABELS_SPACING);
    I[key].style('width', '100px')
    I[key].style('height', '15px')
    I[key].input(reset)
  }
  
	B['reset'] = createButton('&#8635;');
	B['reset'].position(sw - 40 - LABELS_PADDING_X, LABELS_PADDING_Y + 10);
	B['reset'].style("height","40px")
	B['reset'].style("width","40px")
	B['reset'].style("font-size: 2em")
	B['reset'].mousePressed(reset);
}

function labels() {
  noStroke()
  fill("#000000")
  textSize(15);

  for (const [index, [key, value]] of Object.entries(Object.entries(D))) {
    text(key, LABELS_PADDING_X, LABELS_PADDING_Y + index * LABELS_SPACING);
    text(value, LABELS_LENGTH + LABELS_PADDING_X + 100, LABELS_PADDING_Y + index * LABELS_SPACING);
  }

  textSize(20);
  const fps = Math.round(frameRate())
  text(fps + ' fps', sw - 50 - LABELS_PADDING_X, LABELS_PADDING_Y)
}

function reset() {
  for (const [key, input] of Object.entries(I)) {
    if (typeof D[key] == 'boolean') {
      D[key] = input.checked()
    } else {
      D[key] = input.value()
    }
  }

  forest = [Tree(0)]
  console.log({forest})
}

function setup() {
  createCanvas(sw, sh)
  inputs() // draw inputs
  reset() // draw tree
}

function draw() {
  background(255);

  const origin = new vec(sw / 2, sh)

  for (const tree of forest) {
    tree.draw(origin, -Math.PI / 2, 0)
  }

  labels() // draw labels
}