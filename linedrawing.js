//snatched from https://www.redblobgames.com/grids/line-drawing/
function line(p0, p1) {
    let points = [];
    let N = diagonal_distance(p0, p1);
    for (let step = 0; step <= N; step++) {
        let t = N === 0? 0.0 : step / N;
        points.push(round_point(lerp_point(p0, p1, t)));
    }
    return points;
}

function diagonal_distance(p0, p1) {
    let dx = p1.x - p0.x, dy = p1.y - p0.y;
    return Math.max(Math.abs(dx), Math.abs(dy));
}

function round_point(p) {
    return {x: Math.round(p.x), y: Math.round(p.y)};
}

function lerp_point(p0, p1, t) {
    return {x: lerp(p0.x, p1.x, t), y: lerp(p0.y, p1.y, t)};
}

function lerp(start, end, t) {
    return start + t * (end-start);
} //hahga stoplen from https://www.redblobgames.com/grids/line-drawing.html thank yiou