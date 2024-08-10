var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")
canvas.width = window.innerWidth
canvas.height = window.innerHeight
var meteors = [] //流星数组
var allstar = 40 //流星数量
function init() { //根据流星数量的设置填充数组
    for (var i = 0; i < allstar; i++) {
        newmeteor() 
    }
}
function newmeteor(){
    meteors.push({
        lines: [{ //用于存放流星尾巴，初始位置随机
            x: parseInt(Math.random() * canvas.width),
            y: parseInt(Math.random() * canvas.height * 0.7),
        }],
        life: parseInt(Math.random() * 100) + 100, //流星寿命，范围为100-200
        age: 0 //当前年龄值
    })
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (var i = 0; i < meteors.length; i++) { //遍历流星数组
        meteor = meteors[i] //当前流星
        lines = meteor.lines //当前流星的尾巴
        for (var j = 0; j < lines.length; j++) { //遍历尾巴数组
            ctx.fillStyle = "rgba(255,255,255," + j / lines.length + ")" //根据当前的位置设定透明度
            ctx.fillRect(lines[j].x, lines[j].y, 1, 1) //画出尾巴的光点
        }
        ctx.fillStyle = "yellow" //改变填充颜色
        var star = lines[lines.length-1] //尾巴数组的最后元素，也就是流星的头部
        ctx.fillRect(star.x, star.y, 2, 2) //画出稍大的流星头部
        if (meteor.age <= meteor.life / 2) { //判断当前年龄是否少于寿命的一半
            lines.push({ //如过少于寿命的一半，则增加尾巴的长度
                x: star.x+1 , //用于设置流星的飞行方向
                y: star.y+0.3 
            })
        }
        else { //如果年龄已经超过寿命的一半，则从第一个元素开始删除
            lines.shift()
        }
        meteor.age++ //增加流星的年龄
        if (meteor.age >= meteor.life) { //如果年龄达到了寿命的设置，则删除此流星，同时在随机位置增加一颗流星
            meteors.splice(i, 1)
            newmeteor()
        }

    }
}
init()
setInterval(draw, 1)