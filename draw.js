function draw(timesliceData, elem) {
    // if (timesliceData.length > 1) { console.log(timesliceData[timesliceData.length - 1].time - timesliceData[timesliceData.length - 2].time) }
    const obj = timesliceData[timesliceData.length - 1];
    console.log(obj)

    elem.textContent = `${JSON.stringify(obj)}`

}

export {
    draw
}