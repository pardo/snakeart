import './style.css'
import Drawable from './drawable'
import {FisherYatesShuffle, getWindowSizePoint, changeColorLuminance, throttle, range, randomHexColor} from './helpers'
import Rainbow from 'rainbowvis.js'

const TOP_LINE = 1
const RIGHT_LINE = 2
const BOTTOM_LINE = 4
const LEFT_LINE = 8
const ALL_LINES = TOP_LINE + RIGHT_LINE + BOTTOM_LINE + LEFT_LINE

function drawGrid (drawable, width, height, size) {
  let roughCanvas = drawable.roughCanvas
  let options = {
    stroke: 'rgb(0, 0, 0, 0.5)',
    strokeWidth: size / 10,
    bowing: 0.6
  }
  let gridOptions = {
    roughness: 0.6,
    stroke: 'rgb(203, 255, 241, 0.7)',
    strokeWidth: size / 40
  }
  let top = 0
  let bottom = height * size
  let left = 0
  let right = width * size
  range(left, right, size).forEach((position) => {
    // vertical lines
    roughCanvas.line(
      position, bottom,
      position, top,
      gridOptions
    )
  })
  range(top, bottom, size).forEach((position) => {
    // horizontal lines
    roughCanvas.line(
      left, position,
      right, position,
      gridOptions
    )
  })
  // top left > top right
  roughCanvas.line(
    left, top,
    right, top,
    options
  )
  // top right > bottom right
  roughCanvas.line(
    right, top,
    right, bottom,
    options
  )
  // bottom right > bottom left
  roughCanvas.line(
    right, bottom,
    left, bottom,
    options
  )
  // bottom left > top left
  roughCanvas.line(
    left, bottom,
    left, top,
    options
  )
}

/*
data.x = 10 // canvas relative
data.y = 10 // canvas relative
data.size = 10
data.color = color
// add transparency
data.strokeColor = changeColorLuminance(this.color, -0.7) + '80'

*/

function drawNormalBlockLines (drawable, data) {
  var roughCanvas = drawable.roughCanvas
  var offset = data.size * 0.12 // this will draw lines outside the block
  var left = data.x
  var top = data.y
  var bottom = data.y + data.size
  var right = data.x + data.size
  // strokeWidth
  var lineOptions = {
    strokeWidth: data.size * 0.06,
    stroke: data.strokeColor
  }
  // top line
  if (data.lines & 1) {
    roughCanvas.line(left - offset, top, right + offset, top, lineOptions)
  }
  // right line
  if (data.lines >> 1 & 1) {
    roughCanvas.line(right, top - offset, right, bottom + offset, lineOptions)
  }
  // bottom line
  if (data.lines >> 2 & 1) {
    roughCanvas.line(left - offset, bottom, right + offset, bottom, lineOptions)
  }
  // left line
  if (data.lines >> 3 & 1) {
    roughCanvas.line(left, top - offset, left, bottom + offset, lineOptions)
  }
}

function drawBlock (drawable, data) {
  let roughCanvas = drawable.roughCanvas
  // draw the block
  var margin = data.size * 0.1
  var left = data.x
  var right = data.x + data.size
  var top = data.y
  var bottom = data.y + data.size
  /*
  Block diagram from drawing margins

  ##b##c##
  ##-##-##
  e-f##g-h
  ########
  ########
  i-j##k-l
  ##-##-##
  ##n##o##
  */

  var b = [left + margin, top]
  var c = [right - margin, top]

  var e = [left, top + margin]
  var f = [left + margin, top + margin]
  var g = [right - margin, top + margin]
  var h = [right, top + margin]

  var i = [left, bottom - margin]
  var j = [left + margin, bottom - margin]
  var k = [right - margin, bottom - margin]
  var l = [right, bottom - margin]

  var n = [left + margin, bottom]
  var o = [right - margin, bottom]

  var lines = []
  var points = []
  switch (data.lines) {
    case ALL_LINES:
      points = [f, g, k, j]
      lines = [
        [f, g], [g, k], [k, j], [j, f]
      ]
      break
    case TOP_LINE + BOTTOM_LINE:
      points = [e, h, l, i]
      lines = [[e, h], [l, i]]
      break
    case LEFT_LINE + RIGHT_LINE:
      points = [b, c, o, n]
      lines = [[b, n], [c, o]]
      break
    case ALL_LINES - TOP_LINE:
      points = [b, c, k, j]
      lines = [
        [c, k], [k, j], [j, b]
      ]
      break
    case ALL_LINES - RIGHT_LINE:
      points = [f, h, l, j]
      lines = [
        [f, h], [l, j], [j, f]
      ]
      break
    case ALL_LINES - BOTTOM_LINE:
      points = [f, g, o, n]
      lines = [
        [f, g], [g, o], [n, f]
      ]
      break
    case ALL_LINES - LEFT_LINE:
      points = [e, g, k, i]
      lines = [
        [e, g], [g, k], [k, i]
      ]
      break
    case LEFT_LINE + BOTTOM_LINE:
      points = [j, b, c, g, h, l]
      lines = [[c, g], [g, h], [l, j], [j, b]]
      break
    case LEFT_LINE + TOP_LINE:
      points = [f, h, l, k, o, n]
      lines = [[f, h], [l, k], [k, o], [n, f]]
      break
    case RIGHT_LINE + BOTTOM_LINE:
      points = [e, f, b, c, k, i]
      lines = [[e, f], [f, b], [c, k], [k, i]]
      break
    case RIGHT_LINE + TOP_LINE:
      points = [e, g, o, n, j, i]
      lines = [[e, g], [g, o], [n, j], [j, i]]
      break
  }

  roughCanvas.polygon(points, {
    hachureAngle: data.hachureAngle,
    hachureGap: 4,
    roughness: 1.8,
    stroke: 'rgba(0,0,0,0.1)',
    fill: data.color,
    fillStyle: 'zigzag' // solid fill
  })

  var lineOptions = {
    strokeWidth: data.size * 0.06,
    stroke: data.strokeColor
  }

  lines.forEach(line => {
    roughCanvas.line(line[0][0], line[0][1], line[1][0], line[1][1], lineOptions)
  })
}

function drawNormalBlock (drawable, data) {
  let roughCanvas = drawable.roughCanvas
  // draw the block

  roughCanvas.rectangle(data.x, data.y, data.size, data.size, {
    hachureAngle: data.hachureAngle,
    hachureGap: 4,
    roughness: 1.8,
    stroke: 'rgba(0,0,0,0.1)',
    fill: data.color,
    fillStyle: 'zigzag' // solid fill
  })
  drawNormalBlockLines(drawable, data)
}

function getGrayShade (value) {
  // value must be between 0-255
  var c = Math.round(value).toString(16)
  c = ('00' + c).substr(c.length)
  return '#' + c + c + c
}

function Snaker (drawable) {
  this.size = 30 // square size
  this.width = 15 // number of squares to draw
  this.height = 15
  this.color = '#F44336'
  this.strokeColor = changeColorLuminance(this.color, -0.7) + '80'
  this.visitedPositions = []
  this.intialPositions = []
  this.blocksPending = []
  this.drawable = drawable
  this.colorIndex = 0
  this.rainbow = new Rainbow()
  this.grayScaleColors = range(0, 200, 50).map(value => {
    return getGrayShade(value)
  })
  
  this.setSpectrum = function () {
    this.rainbow.setNumberRange(0, 40)

    switch (parseInt(Math.random() * 4)) {
      case 0:
        this.rainbow.setSpectrum('#000000', '#327fb1', '#ffaf55')
        break
      case 1:
        this.rainbow.setSpectrum('#c39de0', '#9e62cc', '#824f8a', '#441c63', '#ff0000', '#310752', '#170326', '#f0cba3')
        break
      case 2:
        this.rainbow.setSpectrum(randomHexColor(), randomHexColor(), randomHexColor())
      case 3:
        this.rainbow.setSpectrum(randomHexColor(), randomHexColor(), randomHexColor(), randomHexColor(), randomHexColor(), randomHexColor())
    }

    this.colors = range(0, 40).map((c) => {
      return '#' + this.rainbow.colorAt(c)
    }).concat(
      range(40, 0).map((c) => {
        return '#' + this.rainbow.colorAt(c)
      })
    )
  }
  this.reset = function () {
    this.setSpectrum()
    this.size = parseInt(Math.random() * 40) + 20
    this.blocksPending = []
    this.drawable.clear()
    this.visitedPositions = []
    this.setGridSize(this.width, this.height)
  }

  this.drawGrid = function () {
    drawGrid(this.drawable, this.width, this.height, this.size)
  }

  this.nextColor = function () {
    this.color = this.colors[this.colorIndex]
    this.strokeColor = changeColorLuminance(this.color, -0.7) + '80'
    this.colorIndex += 1
    this.colorIndex %= this.colors.length
  }

  this.drawTillEnd = function () {
    while (true) {
      try {
        this.draw()
      } catch (e) {
        return
      }
    }
  }
  this.draw = function () {
    this.nextColor()
    var snake = this.getSnake()
    snake.forEach(dataPoint => {
      this.blocksPending.push({
        x: dataPoint.point[0] * this.size,
        y: dataPoint.point[1] * this.size,
        size: this.size,
        color: this.color,
        strokeColor: this.strokeColor,
        hachureAngle: dataPoint.hachureAngle,
        lines: dataPoint.lines
      })
      this.nextColor()
      /*
      data.x = dataPoint.point[0] * this.size
      data.y = dataPoint.point[1] * this.size
      data.lines = dataPoint.lines
      data.color = dataPoint.color ? dataPoint.color : this.color
      data.strokeColor = dataPoint.strokeColor ? dataPoint.strokeColor : this.strokeColor
      data.hachureAngle = dataPoint.hachureAngle
      drawBlock(this.drawable, data)
      */
    })
  }
  this.drawLoop = function () {
    setInterval(() => {
      var data = this.blocksPending.shift()
      if (data) {
        drawBlock(this.drawable, data)
      }
    }, 20)
  }
  this.getEmptyPoint = function () {
    if (this.visitedPositions.length >= this.width * this.height) {
      throw Error('No more positions available')
    }
    if (this.intialPositions.length === 0) {
      // we still have empty place because we if all were visited before
      this.setGridSize(this.width, this.height)
    }
    let position = this.intialPositions.pop()
    if (!this.isVisited(position)) {
      return position
    }
    return this.getEmptyPoint()
  }

  this.markVisited = function (x, y) {
    if (y === undefined) {
      return this.visitedPositions.push(`${x[0]}-${x[1]}`)
    }
    return this.visitedPositions.push(`${x}-${y}`)
  }

  this.isVisited = function (x, y) {
    if (y === undefined) {
      return this.isVisited(x[0], x[1])
    }
    if (x < 0 || x >= this.width) {
      return true
    }
    if (y < 0 || y >= this.height) {
      return true
    }
    return this.visitedPositions.includes(`${x}-${y}`)
  }

  this.getSnakeNextPoint = function (dataPoint) {
    var directions = FisherYatesShuffle(['t', 'r', 'b', 'l'])
    for (let i = 0; i < directions.length; i++) {
      const direction = directions[i]
      const nextPoint = dataPoint.point.slice()
      switch (direction) {
        case 't':
          nextPoint[1] -= 1
          break
        case 'r':
          nextPoint[0] += 1
          break
        case 'b':
          nextPoint[1] += 1
          break
        case 'l':
          nextPoint[0] -= 1
          break
      }
      if (!this.isVisited(nextPoint)) {
        return {
          direction: direction,
          nextPoint: nextPoint
        }
      }
    }

    return {
      direction: undefined,
      nextPoint: undefined
    }
  }

  this.getLinesForDirections = function (previousDirection, direction) {
    var lines = ALL_LINES
    switch (direction) {
      case 't':
        lines = LEFT_LINE + RIGHT_LINE + BOTTOM_LINE
        break
      case 'r':
        lines = LEFT_LINE + TOP_LINE + BOTTOM_LINE
        break
      case 'b':
        lines = LEFT_LINE + RIGHT_LINE + TOP_LINE
        break
      case 'l':
        lines = RIGHT_LINE + TOP_LINE + BOTTOM_LINE
        break
      case undefined:
        lines = ALL_LINES
        break
    }
    if (previousDirection !== undefined) {
      switch (previousDirection) {
        case 't':
          lines -= BOTTOM_LINE
          break
        case 'r':
          lines -= LEFT_LINE
          break
        case 'b':
          lines -= TOP_LINE
          break
        case 'l':
          lines -= RIGHT_LINE
          break
      }
    }
    return lines
  }

  this.getHachureAngleForDirections = function (previousDirection, direction) {
    var hachureAngle = 0
    switch (`${previousDirection}-${direction}`) {
      case 't-b':
      case 'b-t':
      case 't-t':
      case 'b-b':
      case 't-undefined':
      case 'b-undefined':
      case 'undefined-t':
      case 'undefined-b':
        hachureAngle = 0
        break
      case 'l-r':
      case 'r-l':
      case 'r-r':
      case 'l-l':
      case 'r-undefined':
      case 'l-undefined':
      case 'undefined-r':
      case 'undefined-l':
        hachureAngle = 90
        break
      case 'r-b':
      case 'b-r':
      case 't-l':
      case 'l-t':
        hachureAngle = 45
        break
      case 'l-b':
      case 'b-l':
      case 't-r':
      case 'r-t':
        hachureAngle = -45
        break
      case 'undefined-undefined':
        hachureAngle = 0
        break
    }
    return hachureAngle
  }

  this.getSnake = function (snake, dataPoint, previousDirection) {
    snake = snake === undefined ? [] : snake
    if (dataPoint === undefined) {
      dataPoint = {
        point: this.getEmptyPoint()
      }
    }
    snake.push(dataPoint)
    this.markVisited(dataPoint.point)
    var {direction, nextPoint} = this.getSnakeNextPoint(dataPoint)
    dataPoint.lines = this.getLinesForDirections(previousDirection, direction)
    dataPoint.hachureAngle = this.getHachureAngleForDirections(previousDirection, direction)
    if (nextPoint) {
      return this.getSnake(snake, {point: nextPoint}, direction)
    }
    return snake
  }
  this.setGridSize = function (width, height) {
    this.width = width
    this.height = height
    this.intialPositions = []
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.intialPositions.push([x, y])
      }
    }
    this.intialPositions = FisherYatesShuffle(this.intialPositions)
  }
  this.resize = function () {
    this.reset()
    let size = this.drawable.getSize()
    this.setGridSize(
      parseInt(size.width / this.size),
      parseInt(size.height / this.size)
    )
  }
}

// initialization
var drawable = new Drawable()
var snaker = new Snaker(drawable)

window.addEventListener('load', function () {
  let main = document.getElementById('main')
  drawable.createAndAppend(main)
  let size = getWindowSizePoint()
  drawable.resize(size)
  snaker.resize()
  snaker.drawLoop()
  snaker.drawGrid()
  snaker.drawTillEnd()
})

window.addEventListener('resize', throttle(function () {
  let size = getWindowSizePoint()
  drawable.resize(size)
  snaker.resize()
  snaker.drawGrid()
}, 200))

window.addEventListener('keydown', (e) => {
  switch (e.which) {
    case 82:
      // r
      try {
        snaker.draw()
      } catch (e) {
        return
      }
      break
    case 69:
      // e
      snaker.resize()
      snaker.drawGrid()
      break
    case 87:
      // w
      snaker.drawTillEnd()
      break
    default:
      console.log(e.which)
  }
})

console.log(`
Use "r" to draw a single snake
Use "e" to cause a resize and a reset
Use "w" to draw snakes till everything is filled
`)
export default {}
