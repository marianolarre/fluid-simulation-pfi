import {
  Point,
  Color,
  Path,
  Group,
  Rectangle,
  Shape,
  Size,
  PointText,
} from "paper";

export function addPoints(a, b) {
  return new Point(a.x + b.x, a.y + b.y);
}

export function subPoints(a, b) {
  return new Point(a.x - b.x, a.y - b.y);
}

export function mulPoint(a, n) {
  return new Point(a.x * n, a.y * n);
}

export function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

export function remap(t, l1, h1, l2, h2) {
  return l2 + ((h2 - l2) * (t - l1)) / (h1 - l1);
}

export function randomRange(a, b) {
  return lerp(a, b, Math.random());
}

export function createBoxPath(shape, center, size) {
  shape.add(new Point(center.x + size.x, center.y - size.y));
  shape.add(new Point(center.x + size.x, center.y + size.y));
  shape.add(new Point(center.x - size.x, center.y + size.y));
  shape.add(new Point(center.x - size.x, center.y - size.y));
}

export function getColorFromGradient(gradient, percentage) {
  var sections = gradient.length - 1;
  var percentage = Math.max(0, Math.min(1, percentage));
  var index = Math.floor(percentage * sections);
  index = Math.max(0, Math.min(sections, index));
  var c1 = gradient[index];
  index = Math.max(0, Math.min(sections, index + 1));
  var c2 = gradient[index];
  var t = (percentage * sections) % 1;
  var lerpedColor = new Color(
    lerp(c1.red, c2.red, t),
    lerp(c1.green, c2.green, t),
    lerp(c1.blue, c2.blue, t)
  );
  return lerpedColor;
}

export const pressureGradient = [
  new Color(0.3, 0.3, 0.9),
  new Color(0.2, 0.6, 0.9),
  new Color(0.1, 0.8, 0.1),
  new Color(0.8, 0.7, 0.2),
  new Color(0.9, 0.3, 0.3),
  new Color(0.5, 0.3, 0.6),
  new Color(0.2, 0.2, 0.2),
];

export function getInvertedPressureGradient() {
  var list = [];
  for (let i = pressureGradient.length - 1; i >= 0; i--) {
    list.push(pressureGradient[i]);
  }
  return list;
}

export class VectorArrow {
  constructor(
    start,
    end,
    color,
    width,
    headWidth,
    headLength,
    showSecondHead,
    hideFirstHead
  ) {
    this.scale = 1;
    this.start = start;
    this.end = end;
    this.line = new Path([start, end]);
    this.line.strokeColor = color;
    this.width = width;
    this.line.strokeWidth = width;
    this.head = null;
    this.hideFirstHead = hideFirstHead;
    if (!hideFirstHead) {
      this.head = new Path([new Point(0, 0), new Point(0, 0), new Point(0, 0)]);
      this.head.fillColor = color;
      this.head.closed = true;
    }
    this.headWidth = headWidth;
    this.headLength = headLength;
    this.showSecondHead = showSecondHead;
    if (showSecondHead) {
      this.secondHead = new Path([
        new Point(0, 0),
        new Point(0, 0),
        new Point(0, 0),
      ]);
      this.secondHead.fillColor = color;
      this.secondHead.closed = true;
    } else {
      this.secondHead = null;
    }
    this.Update();
  }

  Update() {
    const length = this.start.getDistance(this.end);
    const forward = subPoints(this.end, this.start);
    const right = new Point(forward.y, -forward.x);
    let scale = Math.min(this.headLength, length * 0.75) / this.headLength;
    if (this.showSecondHead) {
      scale = Math.min(this.headLength, length * 0.5) / this.headLength;
    }
    forward.length = this.headLength * scale * this.scale;
    right.length = Math.max(
      this.width * 0.75,
      this.headWidth * scale * this.scale
    );
    let vectorEnd = this.end;
    if (!this.hideFirstHead) {
      vectorEnd = subPoints(this.end, forward);
    }
    let vectorStart = this.start;
    if (this.showSecondHead) {
      vectorStart = addPoints(this.start, forward);
    }

    this.line.segments[0].point = vectorStart;
    this.line.segments[1].point = vectorEnd;

    if (!this.hideFirstHead) {
      this.head.segments[0].point = addPoints(vectorEnd, forward);
      this.head.segments[1].point = addPoints(vectorEnd, right);
      this.head.segments[2].point = subPoints(vectorEnd, right);
    }

    if (this.showSecondHead) {
      vectorEnd = addPoints(this.start, forward);
      this.secondHead.segments[0].point = subPoints(vectorEnd, forward);
      this.secondHead.segments[1].point = subPoints(vectorEnd, right);
      this.secondHead.segments[2].point = addPoints(vectorEnd, right);
    }
  }

  SetColor(newColor) {
    this.line.strokeColor = newColor;
    if (!this.hideFirstHead) {
      this.head.fillColor = newColor;
    }
    if (this.showSecondHead) {
      this.secondHead.fillColor = newColor;
    }
  }

  SetScale(newScale) {
    this.scale = newScale;
    this.line.strokeWidth = newScale * this.width;
    this.Update();
  }

  SetStart(newStart) {
    this.start = newStart;
    this.Update();
  }

  SetEnd(newEnd) {
    this.end = newEnd;
    this.Update();
  }

  SetPosition(newStart, newEnd) {
    this.start = newStart;
    this.end = newEnd;
    this.Update();
  }

  bringToFront() {
    this.line.bringToFront();
    if (!this.hideFirstHead) {
      this.head.bringToFront();
    }
    if (this.showSecondHead) {
      this.secondHead.bringToFront();
    }
  }

  setVisible(visible) {
    this.line.visible = visible;
    if (!this.hideFirstHead) {
      this.head.visible = visible;
    }
    if (this.showSecondHead) {
      this.secondHead.visible = visible;
    }
  }

  Remove() {
    this.line.remove();
    if (!this.hideFirstHead) {
      this.head.remove();
    }
    if (this.showSecondHead) {
      this.secondHead.remove();
    }
  }
}

export class LevelSimbol {
  constructor(position, color) {
    this.position = position;
    this.color = color;
    this.lines = [
      new Path([new Point(0, 0), new Point(0, 0)]),
      new Path([new Point(0, 0), new Point(0, 0)]),
      new Path([new Point(0, 0), new Point(0, 0)]),
    ];
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].strokeColor = color;
      this.lines[i].strokeWidth = 3;
    }
    this.setPosition(position);
  }

  setPosition(newPos) {
    this.position = newPos;
    this.lines[0].segments[0].point = addPoints(new Point(-20, 6), newPos);
    this.lines[0].segments[1].point = addPoints(new Point(20, 6), newPos);
    this.lines[1].segments[0].point = addPoints(new Point(-14, 12), newPos);
    this.lines[1].segments[1].point = addPoints(new Point(14, 12), newPos);
    this.lines[2].segments[0].point = addPoints(new Point(-6, 18), newPos);
    this.lines[2].segments[1].point = addPoints(new Point(6, 18), newPos);
  }

  bringToFront() {
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].bringToFront();
    }
  }

  hide() {
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].visible = false;
    }
  }

  show() {
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].visible = true;
    }
  }

  setColor(color) {
    this.color = color;
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].strokeColor = color;
    }
  }

  remove() {
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].remove();
    }
  }
}

export class VectorArray {
  constructor(
    points,
    color,
    width,
    headWidth,
    headLength,
    distance,
    stepMagnitudes,
    options
  ) {
    if (this.points == null) {
      this.points = [new Point(0, 0)];
      this.color = "#000";
      this.width = 5;
      this.headWidth = 10;
      this.headLength = 15;
      this.distance = 10;
      this.stepMagnitudes = [0];
      this.options = {};
      this.vectors = [];
      this.profile = new Path({
        strokeColor: "black",
        strokeWidth: 2,
      });
    } else {
      this.points = points;
      this.color = color;
      this.width = width;
      this.headWidth = headWidth;
      this.headLength = headLength;
      this.distance = distance;
      this.stepMagnitudes = stepMagnitudes;
      this.options = options || {};
      this.closed = (options && options.closed) || false;
      this.vectors = [];
      this.profile = new Path({
        strokeColor: "black",
        strokeWidth: 2,
      });
      this.Update();
    }
  }

  SetValues(points, stepMagnitudes, distance, options) {
    this.points = points;
    this.stepMagnitudes = stepMagnitudes;
    if (distance != null && distance != 0) this.distance = distance;
    if (options != null && options.inverted != null)
      this.options.inverted = options.inverted;
    if (options != null && options.centered != null)
      this.options.centered = options.centered;
    if (options != null && options.otherEnd != null)
      this.options.otherEnd = options.otherEnd;
    if (options != null && options.closed != null)
      this.options.closed = options.closed;
    this.Update();
  }

  Reset() {
    for (let i = 0; i < this.vectors.length; i++) {
      if (this.vectors[i] != null) {
        this.vectors[i].Remove();
        delete this.vectors[i];
      }
    }
    this.profile.visible = false;
  }

  Update() {
    // Initialization
    this.Reset();
    this.profile.visible = true;

    // Create Vectors
    let distanceCarry = 0;
    let vectorId = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      const start = this.points[i];
      const end = this.points[i + 1];
      const startMagnitude = this.stepMagnitudes[i];
      const endMagnitude = this.stepMagnitudes[i + 1];
      let difference = subPoints(end, start);
      let segmentDistanceLeft = difference.length - distanceCarry;
      const count = Math.ceil(0.01 + segmentDistanceLeft / this.distance);

      // Offset between vectors
      let delta = new Point(difference.x, difference.y);
      delta.length = this.distance;
      const deltaPercentage = this.distance / difference.length;

      let position = new Point(start.x, start.y);
      let forward = new Point(delta.x, delta.y);
      forward.length = 1;
      let normal = new Point(forward.y, -forward.x);

      if (this.options.inverted) {
        normal.x = -normal.x;
        normal.y = -normal.y;
      }

      /*if (this.centered) {
        let offsetMagnitude = (totalDistance % this.distance) / 2;
        let offset = new Point(delta.x, delta.y);
        offset.length = offsetMagnitude;
        position = addPoints(position, offset);
      }*/

      let carriedPercentage = distanceCarry / difference.length;
      let percentage = carriedPercentage;
      position = addPoints(position, mulPoint(forward, distanceCarry));

      for (let j = 0; j < count; j++) {
        let magnitude = lerp(startMagnitude, endMagnitude, percentage);
        const vectorStart = new Point(position.x, position.y);
        const vectorEnd = addPoints(position, mulPoint(normal, magnitude));
        if (this.vectors[vectorId] != null) {
          this.vectors[vectorId].SetPosition(vectorStart, vectorEnd);
        } else {
          let creation = new VectorArrow(
            vectorStart,
            vectorEnd,
            this.color,
            this.width,
            this.headWidth,
            this.headLength,
            this.options.otherEnd,
            this.options.otherEnd
          );
          this.vectors[vectorId] = creation;
        }
        vectorId++;
        percentage += deltaPercentage;
        position = addPoints(position, delta);
        segmentDistanceLeft -= this.distance;
      }

      distanceCarry = -segmentDistanceLeft;
    }

    // Profile
    const profilePoints = [];
    for (let _i = 0; _i <= this.points.length - 1; _i++) {
      let i = _i % (this.points.length - 1);
      if (!this.options.closed && _i >= this.points.length - 1) {
        break;
      }
      const start = this.points[i];
      const end = this.points[i + 1];
      let difference = subPoints(end, start);
      let normal = new Point(difference.y, -difference.x);
      if (this.options.inverted)
        normal = new Point(-difference.y, difference.x);
      normal.length = 1;
      const startMagnitude = this.stepMagnitudes[i];
      const endMagnitude = this.stepMagnitudes[i + 1];
      profilePoints.push(addPoints(start, mulPoint(normal, startMagnitude)));
      if (!this.options.closed && _i == this.points.length - 2) {
        profilePoints.push(addPoints(end, mulPoint(normal, endMagnitude)));
      }
    }
    this.profile.segments = profilePoints;
  }
}

export class ScrollingRectangle {
  constructor(
    position,
    size,
    angle,
    waveSpeed,
    waveCount,
    backgroundColor,
    waveColor
  ) {
    this.clipMask = new Shape.Rectangle(new Point(0, 0), size);
    this.background = new Shape.Rectangle(new Point(0, 0), size);
    this.background.fillColor = backgroundColor;
    this.position = position;
    this.size = size;
    this.waveSpeed = waveSpeed;
    this.waveCount = waveCount;
    this.waves = [];
    const group = new Group([this.clipMask, this.background]);
    group.clipped = true;
    const waveSize = new Size(size.width / waveCount, size.height);
    for (let i = 0; i < this.getWaveShapeCount(); i++) {
      const newWave = new Shape.Rectangle(
        new Point((i * size.width * 2) / waveCount, 0),
        waveSize
      );
      newWave.fillColor = waveColor;
      this.waves.push(newWave);
      group.addChild(newWave);
    }
    group.applyMatrix = false;
    group.translate(position);
    group.rotate(angle);
    this.group = group;
  }

  update(delta) {
    const motion = new Point(delta * this.waveSpeed, 0);
    const waveWidth = this.size.width / this.waveCount;
    if (this.waveSpeed > 0) {
      for (let i = 0; i < this.getWaveShapeCount(); i++) {
        if (this.waves[i].position.x < this.size.width + waveWidth / 2) {
          this.waves[i].translate(motion);
        } else {
          if (this.waveCount % 2 == 0) {
            this.waves[i].translate(
              motion.x - waveWidth * 2 - this.size.width,
              0
            );
          } else {
            this.waves[i].translate(motion.x - waveWidth - this.size.width, 0);
          }
        }
      }
    }
    if (this.waveSpeed < 0) {
      for (let i = 0; i < this.getWaveShapeCount(); i++) {
        if (this.waves[i].position.x > -waveWidth / 2) {
          this.waves[i].translate(motion);
        } else {
          if (this.waveCount % 2 == 0) {
            this.waves[i].translate(
              motion.x + waveWidth * 2 + this.size.width,
              0
            );
          } else {
            this.waves[i].translate(motion.x + waveWidth + this.size.width, 0);
          }
        }
      }
    }
  }

  getWaveShapeCount() {
    return (this.waveCount + 1) / 2;
  }

  bringToFront() {
    this.group.bringToFront();
  }

  sendToBack() {
    this.group.sendToBack();
  }

  setSpeed(newSpeed) {
    this.waveSpeed = newSpeed;
  }

  setPosition(point) {
    this.group.position.set(point);
  }

  setRotation(rotation) {
    this.group.rotation = rotation;
  }

  setHeight(newHeight) {
    this.clipMask.size.height = newHeight;
    this.background.size.height = newHeight;
    for (let i = 0; i < this.getWaveShapeCount(); i++) {
      this.waves[i].size.height = newHeight;
    }
  }

  remove() {
    this.background.remove();
    for (let i = 0; i < this.getWaveShapeCount(); i++) {
      this.waves[i].remove();
    }
  }
}

export class VelocityParticle {
  constructor(position, velocity, color, lengthScale, widthScale, lifeTime) {
    this.line = new Path();
    this.line.add(subPoints(position, mulPoint(velocity, this.lengthScale)));
    this.line.add(addPoints(position, mulPoint(velocity, this.lengthScale)));
    this.initialize(
      position,
      velocity,
      color,
      lengthScale,
      widthScale,
      lifeTime
    );
  }

  initialize(position, velocity, color, lengthScale, widthScale, lifeTime) {
    this.position = position;
    this.velocity = velocity;
    this.lengthScale = lengthScale || this.lengthScale;
    this.widthScale = widthScale || this.widthScale;
    this.lifeTime = lifeTime || this.lifeTime;
    this.currentLife = lifeTime || this.lifeTime;
    this.color = color || this.color;
    this.line.segments[0].point = subPoints(
      position,
      mulPoint(velocity, this.lengthScale)
    );
    this.line.segments[1].point = addPoints(
      position,
      mulPoint(velocity, this.lengthScale)
    );
    this.line.strokeColor = this.color;
    this.line.strokeCap = "round";
    this.strokeWidth = widthScale;
    this.active = true;
    this.line.visible = true;
  }

  setVelocity(newVelocity) {
    this.velocity = newVelocity;
    this.line.segments[0].point = subPoints(
      this.position,
      mulPoint(newVelocity, this.lengthScale)
    );
    this.line.segments[1].point = addPoints(
      this.position,
      mulPoint(newVelocity, this.lengthScale)
    );
  }

  update(delta) {
    if (!this.active) return;

    var n = this.currentLife / this.lifeTime;
    var size = (-(n * n) + n) * 4 * this.widthScale;
    this.line.strokeWidth = size;
    const movement = mulPoint(this.velocity, delta);
    this.position = addPoints(this.position, movement);
    this.line.translate(movement);
    this.currentLife -= delta;
    if (this.currentLife <= 0) {
      this.active = false;
      this.line.visible = false;
    }
  }

  remove() {
    this.line.remove();
  }
}

export class ColorScaleReference {
  constructor(position, size, colors, min, max, secondaryColor, unit) {
    this.position = position;
    this.size = size;
    this.colors = colors;
    this.min = min;
    this.max = max;
    this.unit = unit;
    this.shape = new Shape.Rectangle(position, size);
    this.shape.style = {
      fillColor: {
        gradient: {
          stops: colors,
        },
        origin: position,
        destination: addPoints(position, new Point(0, size.height)),
      },
      strokeColor: secondaryColor || "black",
      strokeWidth: 2,
    };
    this.markers = [
      {
        text: new PointText({
          point: addPoints(position, new Point(-5, 10)),
          content: max + (this.unit || ""),
          fillColor: secondaryColor || "black",
          justification: "right",
          fontSize: 25,
        }),
      },
      {
        text: new PointText({
          point: addPoints(position, new Point(-5, size.height / 2 + 10)),
          content: (min + max) / 2 + (this.unit || ""),
          justification: "right",
          fillColor: secondaryColor || "black",
          fontSize: 25,
        }),
      },
      {
        text: new PointText({
          point: addPoints(position, new Point(-5, size.height + 10)),
          content: min + (this.unit || ""),
          justification: "right",
          fillColor: secondaryColor || "black",
          fontSize: 25,
        }),
      },
    ];
  }

  setRange(min, max) {
    this.markers[0].text.content =
      Math.round(max * 100) / 100 + (this.unit || "");
    this.markers[1].text.content =
      Math.round((min + max) * 50) / 100 + (this.unit || "");
    this.markers[2].text.content =
      Math.round(min * 100) / 100 + (this.unit || "");
  }

  setVisible(visible) {
    this.shape.visible = visible;
    this.markers[0].text.visible = visible;
    this.markers[1].text.visible = visible;
    this.markers[2].text.visible = visible;
  }
}

export class CoordinateReference {
  constructor(position, direction, label, color) {
    if (color == null) {
      color = "grey";
    }
    const tip = addPoints(position, mulPoint(direction, 75));
    this.arrow = new VectorArrow(position, tip, color, 3, 6, 10, false, false);
    const offset = new Point(-10, 20);
    this.text = new PointText({
      position: addPoints(tip, offset),
      content: label,
      fontSize: 18,
      fillColor: color,
      justification: "right",
    });
  }

  bringToFront() {
    this.arrow.bringToFront();
    this.text.bringToFront();
  }
}
