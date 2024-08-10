// 拖拽管理
class DragBox {
    constructor(data = {
        dragDomAttArr: [
            {
                id: 0, cellPosStr: "0,0", backgroundColor: "#AC33C1"
            },
            {
                id: 1, cellPosStr: "1,0", backgroundColor: "#E33C64"
            },
            {
                id: 2, cellPosStr: "2,0", backgroundColor: "#2A82E4"
            },
            {
                id: 3, cellPosStr: "0,1", backgroundColor: "#FF5733"
            },
            {
                id: 4, cellPosStr: "1,1", backgroundColor: "#00BAAD"
            }
        ],
    }) {
        const contentDom = document.querySelector(".content");
        const stickerBoxDom = document.querySelector(".sticker-box");
        const sDashedBoxDom = document.querySelector(".s-dashed-box");
        let dragEntityArr = [];
        let dashedEntityArr = [];

        EventComp.init();

        // 设置可拖动 dom
        data.dragDomAttArr.forEach((item) => {
            const entity = new Entity();
            dragEntityArr.push(entity);

            // 创建 Dom
            entity.addComp(new CreateDom({
                parentDom: stickerBoxDom,
            }));

            // 绘制形状
            entity.addComp(new ShapeComp({
                dom: entity.getComp("CreateDom").dom,
                id: item.id,
                classNameArr: ["s-drag-dom"],
                backgroundColorStr: item.backgroundColor
            }));

            // 设置位置
            entity.addComp(new PosComp({
                dom: entity.getComp("ShapeComp").dom,
                cellPosStr: item.cellPosStr
            }));

            // 添加事件组件
            entity.addComp(new EventComp({
                dom: entity.getComp("ShapeComp").dom,
                rangeDom: contentDom,
                events: new Map([

                    ["拖动开始时", function () {
                        this.getComp("ShapeComp").removeClassList("drag-tran-other");
                        this.getComp("ShapeComp").addClassList("drag", "drag-tran");
                        dragEntityArr.forEach(item => {
                            if (!(item === this)) {
                                this.getComp("ShapeComp").removeClassList("drag-tran");
                                item.getComp("ShapeComp").addClassList("drag-other", "drag-tran-other");
                            }
                        });
                        dashedEntityArr.forEach(item => {
                            item.getComp("ShapeComp").addClassList("drag");
                        })
                    }.bind(entity)],

                    ["拖动中", function (e) {
                        const initPos = e.detail.initPos;
                        const disPos = { x: initPos.x - this.getComp("PosComp").rePos.x, y: initPos.y - this.getComp("PosComp").rePos.y };
                        this.getComp("PosComp").pos = { x: e.detail.clientX - disPos.x, y: e.detail.clientY - disPos.y };

                        // 鼠标在 stickerBoxDom 中的位置
                        const cellPosStr = PosComp.posInCellPos({ x: e.detail.clientX - stickerBoxDom.offsetLeft, y: e.detail.clientY - stickerBoxDom.offsetTop });

                        dragEntityArr.forEach(item => {
                            if (item.getComp("ShapeComp").id === this.getComp("ShapeComp").id) {
                                return;
                            }
                            // 若格子有东西
                            if (item.getComp("PosComp").reCellPosStr === cellPosStr) {
                                if (item.getComp("PosComp").cellPosStr !== this.getComp("PosComp").reCellPosStr) {
                                    item.getComp("PosComp").cellPosStr = this.getComp("PosComp").reCellPosStr;
                                }
                            } else {
                                item.getComp("PosComp").cellPosStr = item.getComp("PosComp").reCellPosStr;
                            }
                        })

                    }.bind(entity)],

                    ["拖动结束", function (e) {
                        const cellPosStr = PosComp.posInCellPos({ x: e.detail.clientX - stickerBoxDom.offsetLeft, y: e.detail.clientY - stickerBoxDom.offsetTop });

                        // 设置拖动的 Dom
                        const isHaveCell = dashedEntityArr.some(item => item.getComp("ShapeComp").datasetPos === cellPosStr);
                        if (isHaveCell) {
                            this.getComp("PosComp").cellPosStr = cellPosStr;
                            this.getComp("PosComp").reCellPosStr = this.getComp("PosComp").cellPosStr;
                            this.getComp("PosComp").rePos = this.getComp("PosComp").pos;
                        } else {
                            this.getComp("PosComp").cellPosStr = this.getComp("PosComp").reCellPosStr;
                        }
                        this.getComp("ShapeComp").removeClassList("drag");


                        // 设置未拖动的 Dom
                        dragEntityArr.forEach(item => {
                            if (item.getComp("ShapeComp").id === this.getComp("ShapeComp").id) {
                                return;
                            }
                            item.getComp("PosComp").reCellPosStr = item.getComp("PosComp").cellPosStr;
                            item.getComp("PosComp").rePos = item.getComp("PosComp").pos;
                            item.getComp("ShapeComp").removeClassList("drag-other");
                        });

                        // 设置虚线框
                        dashedEntityArr.forEach(item => {
                            item.getComp("ShapeComp").removeClassList("drag");
                        })

                    }.bind(entity)]
                ]),
            }));

        });

        // 设置虚线格子
        sDashedBoxDom.querySelectorAll(".s-dashed-cell").forEach(item => {
            const entity = new Entity();
            dashedEntityArr.push(entity);

            // 添加形状组件
            entity.addComp(new ShapeComp({
                dom: item,
                datasetPos: item.dataset.pos
            }));
        })
    }
}

// 单体
class Entity {
    constructor() {
        this._compMap = new Map();
    }

    addComp(comp) {
        this._compMap.set(comp.name, comp);
    }

    getComp(compName) {
        return this._compMap.get(compName);
    }
}

// 用来创建 Dom 的组件
class CreateDom {
    constructor(data) {
        this.name = "CreateDom";
        this.dom = document.createElement("div");
        data.parentDom.appendChild(this.dom);
    }
}

// 形状组件
class ShapeComp {
    constructor(data) {
        this.name = "ShapeComp";
        this.dom = data.dom;
        if (data.id) {
            this.id = data.id;
        }
        if (this.dom.dataset.pos) {
            this.datasetPos = this.dom.dataset.pos;
        }
        if (data.backgroundColorStr) {
            this.dom.style.backgroundColor = data.backgroundColorStr;
        }
        if (data.classNameArr) {
            this.addClassList(...data.classNameArr);
        }
    }

    addClassList(...classNameArr) {
        this.dom.classList.add(...classNameArr);
    }

    removeClassList(...classNameArr) {
        this.dom.classList.remove(...classNameArr);
    }
}

// 位置组件
class PosComp {
    constructor(data) {
        this.name = "PosComp";
        this._dom = data.dom
        this._pos = null;
        this._cellPosStr = null;

        // 初始化位置
        this.cellPosStr = data.cellPosStr;

        this.rePos = this.pos;
        this.reCellPosStr = this.cellPosStr;
    }

    // 获取位置所属的格子位置字符
    static posInCellPos(pos) {
        const cellPosX = Math.floor((pos.x - 4) / 160);
        const cellPosY = Math.floor((pos.y - 4) / 160);
        return `${cellPosX},${cellPosY}`;
    }

    set cellPosStr(value) {
        const arr = value.split(',').map(Number);
        const [x, y] = arr;
        const pos = {
            x: x * 160 + 4,
            y: y * 160 + 4
        }
        this.pos = pos;
        this._cellPosStr = value;
    }

    get cellPosStr() {
        return this._cellPosStr;
    }

    set pos(value) {
        this._dom.style.top = value.y + "rem";
        this._dom.style.left = value.x + "rem";
        this._pos = value;
    }

    get pos() {
        return this._pos;
    }
}


// 事件组件
class EventComp {
    constructor(data) {
        this.name = "EventComp";
        this._dom = data.dom;
        this._rangeDom = data.rangeDom;
        this._events = data.events;

        this._events.forEach((value, key) => {
            this.addEvent(key, value);
        });
    }

    // 静态初始化
    static init() {
        EventComp._dragBeginEvent = new CustomEvent("拖动开始时");
        EventComp._dragEvent = new CustomEvent("拖动中", {
            detail: {
                initPos: null,
                clientX: null,
                clientY: null,
            }
        });
        EventComp._dragEndEvent = new CustomEvent("拖动结束", {
            detail: {
                clientX: null,
                clientY: null
            }
        });
    }

    // 监听拖动事件的触发
    listenDrag() {
        let isDragBegin = false;
        const onMouseup = (e) => {
            EventComp._dragEndEvent.detail.clientX = e.clientX;
            EventComp._dragEndEvent.detail.clientY = e.clientY;
            this._dom.dispatchEvent(EventComp._dragEndEvent);
            isDragBegin = false;
            this._rangeDom.onmousemove = null;
            this._rangeDom.onmouseup = null;
            this._rangeDom.onmouseleave = null;
        }
        this._dom.onmousedown = (event) => {
            const initPos = { x: event.clientX, y: event.clientY };
            this._rangeDom.onmousemove = (e) => {
                const s = Math.sqrt(Math.pow(e.clientX - initPos.x, 2) + Math.pow(e.clientY - initPos.y, 2));
                // 当移动距离大于 10 时开始拖动
                if (s > 10) {
                    if (!isDragBegin) {
                        isDragBegin = true;
                        this._dom.dispatchEvent(EventComp._dragBeginEvent);
                    }
                    EventComp._dragEvent.detail.initPos = initPos;
                    EventComp._dragEvent.detail.clientX = e.clientX;
                    EventComp._dragEvent.detail.clientY = e.clientY;

                    this._dom.dispatchEvent(EventComp._dragEvent);
                }
            }

            this._rangeDom.onmouseup = onMouseup;
            this._rangeDom.onmouseleave = onMouseup;
        }
    }

    addEvent(key, value) {
        switch (key) {
            case "拖动开始时":
            case "拖动中":
            case "拖动结束":
                this.listenDrag();
                break;
        }
        this._dom.addEventListener(key, value);
        this._events.set(key, value);
    }

    removeEvent(key) {
        this._dom.removeEventListener(key, this._events.get(key));
        this._events.delete(key);
    }
}

new DragBox();