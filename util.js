/**
 * Clamp num to the range [lo,hi].
 */
function clamp(num, lo, hi) {
    if (num < lo) {
        return lo;
    } else if (num > hi) {
        return hi;
    } else {
        return num;
    }
}
