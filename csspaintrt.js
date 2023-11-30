registerPaint("randomtesting", class {
    static get inputProperties() {
        return ["--shit"]; //kinda like react?
    }

    paint(context, size, props) {
        //console.log(props, Object.getOwnPropertyNames(props), Reflect.ownKeys(props));
        context.fillStyle = "green";
        context.fillRect(0,0, props.get("--shit"),size.height);
    }
});