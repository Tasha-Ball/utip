// шапка таблицы
const headers = [
    { title: "Название", field: "name" },
    { title: "Гравитация", field: "gravity" },
    { title: "Численность населения", field: "population" },
    { title: "Местность", field: "terrain" },
    { title: "Диаметр", field: "diameter" }
]
let ind = 1; // индекс для сортировки таблицы
let page = 1; // страница таблицы
const info = document.getElementById('info');
const noInfo = document.getElementById('no-info');
const next = document.getElementById('next');
const prev = document.getElementById('prev');
const preloader = document.getElementById('preloader');
const control = document.getElementById('control');
let draggableW, draggableH= false
let dragTarget, dragTargetSize, click, width = null

// рендеринг таблицы
function render(data) {
    document.getElementById('page').innerHTML = data[0].results.length*page + " из " + data[0].count
    sessionStorage.setItem('data', JSON.stringify(data))
    info.innerHTML = ""

    let table = document.createElement('table');
    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody');
    
    // шапка таблицы
    let tr = document.createElement('tr');
    headers.forEach((head) => {
        let th = document.createElement('th');
        th.onclick = (event) => {
            event.preventDefault();
            sort(head.field, data);
        };
        th.innerHTML = head.title;

        // роллер вертикальный (для ресайза)
        let rollerVertical = document.createElement('span');
        rollerVertical.classList.add('roller-vertical');
        rollerVertical.onmousedown = (event) => {
            event.preventDefault();
            draggableW = true
            document.body.style.cursor = "w-resize";
            dragTarget = event.target.parentNode;
            dragTargetSize = dragTarget.clientWidth;
            click = event.x;
        }
        th.onmousemove = (event) => {
            if ( draggableW && dragTargetSize + event.x - click > 50) {
                width = event.x - click
                resizeTableWidth(dragTarget, dragTargetSize, width)
            }
        }
        th.appendChild(rollerVertical);

        tr.appendChild(th);
    })
    // роллер горизонтальный (для ресайза)
    let rollerHorizontal = document.createElement('span');
    rollerHorizontal.classList.add('roller-horizontal');
    rollerHorizontal.onmousedown = (event) => {
        event.preventDefault();
        draggableH = true
        document.body.style.cursor = "w-resize";
        dragTarget = event.target.parentNode;
        dragTargetSize = dragTarget.clientHeight;
        click = event.y;
    }
    tr.onmousemove = (event) => {
        if ( draggableH && dragTargetSize + event.y - click > 5) {
            width = event.y - click
            dragTarget.style.height = `${dragTargetSize + width}px`
        }
    }
    tr.appendChild(rollerHorizontal);

    thead.appendChild(tr);

    // тело таблицы
    data[0].results.forEach((item) => {
        let tr = document.createElement('tr');
        headers.forEach((el) => {
            let td = document.createElement('td');
            td.innerHTML = item[el.field];

            // роллер вертикальный (для ресайза)
            let rollerVertical = document.createElement('span');
            rollerVertical.classList.add('roller-vertical');
            rollerVertical.onmousedown = (event) => {
                event.preventDefault();
                draggableW = true
                document.body.style.cursor = "w-resize";
                dragTarget = event.target.parentNode;
                dragTargetSize = dragTarget.clientWidth;
                click = event.x;
            }
            td.onmousemove = (event) => {
                if ( draggableW && dragTargetSize + event.x - click > 50) {
                    width = event.x - click
                    resizeTableWidth(dragTarget, dragTargetSize, width)
                }
            }
            td.appendChild(rollerVertical);

            // контекстное меню (клик правой кнопкой)
            let contextMenu = document.createElement('div');
            contextMenu.classList.add('context-menu')
            contextMenu.innerHTML = "Удалить"
            contextMenu.onclick = (event) => {
                event.preventDefault();
                removeItem(el.field, item, data)
            };
            td.appendChild(contextMenu);
            td.oncontextmenu = (event) => {
                event.preventDefault();
                if (document.getElementById('check')) document.getElementById('check').removeAttribute('id')
                contextMenu.setAttribute('id', 'check')
                contextMenu.style.top = event.offsetY + 'px'
                contextMenu.style.left = event.offsetX + 'px'
            };

            tr.appendChild(td);
        })
        // роллер горизонтальный (для ресайза)
        let rollerHorizontal = document.createElement('span');
        rollerHorizontal.classList.add('roller-horizontal');
        rollerHorizontal.onmousedown = (event) => {
            event.preventDefault();
            draggableH = true
            document.body.style.cursor = "w-resize";
            dragTarget = event.target.parentNode;
            dragTargetSize = dragTarget.clientHeight;
            click = event.y;
        }
        tr.onmousemove = (event) => {
            if ( draggableH && dragTargetSize + event.y - click > 5) {
                width = event.y - click
                dragTarget.style.height = `${dragTargetSize + width}px`
            }
        }

        // механизм drag&drop
        tr.setAttribute('draggable', true)
        tr.addEventListener('dragstart', handleDragStart);
        tr.addEventListener('dragover', handleDragOver);
        tr.addEventListener('dragenter', handleDragEnter);
        tr.addEventListener('dragleave', handleDragLeave);
        tr.addEventListener('dragend', handleDragEnd);
        tr.addEventListener('drop', handleDrop);

        tr.appendChild(rollerHorizontal);

        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    
    noInfo.style.display = 'none';
    info.appendChild(table);
    control.style.display = 'flex';
    setTableSize();
};

// запрос на сервер
async function getData(side) {
    preloader.classList.add('preloader')
    side ? page++ : page--

    let data = []
    await fetch(`https://swapi.dev/api/planets/?page=${page}`)
        .then((res) => res.json())
        .then(res => data = Array(res).map(object => ({ ...object })))
        .catch((err) => console.log(err))
        
    changePage(data);
    sessionStorage.setItem('page', page)
    preloader.classList.remove('preloader')
    data ? render(data) : false
};

// заполнить или очистить таблицу
function changeContent(flag) {
    if (flag) {
        noInfo.style.display = 'none';
        page = 2;
        getData();
    } else {
        noInfo.style.display = 'block';
        control.style.display = 'none';
        info.innerHTML = ''
        sessionStorage.clear()
    }
};

// сортировка таблицы
function sort(field, data) {
    ind = -ind
    data[0].results.sort((a,b) => {
        if (a[field] > b[field]) return ind;
        if (a[field] < b[field]) return -ind;
        return 0;
    });
    render(data);
}

// проверка на наличие следующей или предыдущей страницы
function changePage(data) {
    if (!data[0].next) {
        next.classList.remove('page')
        next.setAttribute('disabled', true)
    } else {
        next.classList.add('page')
        next.removeAttribute('disabled')
    }

    if (!data[0].previous) {
        prev.classList.remove('page')
        prev.setAttribute('disabled', true)
    } else {
        prev.classList.add('page')
        prev.removeAttribute('disabled')
    }
}

// событие мыши (для ресайза)
document.onmouseup = () => {
    if (draggableW) {
        resizeTableWidth(dragTarget, dragTargetSize, width)
        let widthColumn = []
        document.querySelectorAll('th').forEach((th) => {
            widthColumn.push(th.clientWidth)
        })
        sessionStorage.setItem('widthColumn', JSON.stringify(widthColumn))
        document.body.style.cursor = "default"
        dragTarget, dragTargetSize, click, width = null
        draggableW = false
    }
    if (draggableH) {
        dragTarget.style.height = `${dragTargetSize + width}px`
        let heightColumn = []
        document.querySelectorAll('tr').forEach((tr) => {
            heightColumn.push(tr.clientHeight)
        })
        sessionStorage.setItem('heightColumn', JSON.stringify(heightColumn))
        document.body.style.cursor = "default"
        dragTarget, dragTargetSize, click, width = null
        draggableH = false
    }
}

// изменение ширины столбцов
function resizeTableWidth(dragTarget, dragTargetSize, width) {
    const tds = document.querySelectorAll(`td:nth-child(${dragTarget.cellIndex+1}),th:nth-child(${dragTarget.cellIndex+1})`)
    if ( tds ){
        tds.forEach( (td) => {
            td.style.minWidth = `${dragTargetSize + width}px`
            td.style.maxWidth = `${dragTargetSize + width}px`
        })
    }
}

// изменение ширины и/или высоты столбцов/строк
function setTableSize() {
    const widthColumn = JSON.parse(sessionStorage.getItem('widthColumn'))
    const heightColumn = JSON.parse(sessionStorage.getItem('heightColumn'))

    if (widthColumn) {
        for (let ind = 0; ind < widthColumn.length; ind++) {
            const tds = document.querySelectorAll(`td:nth-child(${ind+1}),th:nth-child(${ind+1})`)
            tds.forEach( (td) => {
                td.style.minWidth = `${widthColumn[ind]}px`
                td.style.maxWidth = `${widthColumn[ind]}px`
            })
        }
    } else {
        const widthTable = document.getElementById('table').clientWidth
        const width = widthTable / headers.length
        const ths = document.querySelectorAll("th,td")
        ths.forEach( (el) => {
            el.style.minWidth = `${width}px`
            el.style.maxWidth = `${width}px`
        })
    }

    if (heightColumn) {
        for (let ind = 1; ind < heightColumn.length; ind++) {
            const trs = document.querySelectorAll(`tr:nth-child(${ind})`)
            trs.forEach( (tr) => {
                tr.parentNode.nodeName==='THEAD'
                    ? tr.style.height = `${heightColumn[0]}px`
                    : tr.style.height = `${heightColumn[ind]}px`
            })
        }
    }

}

// открытие контекстного меню (удалить значение таблицы)
function removeItem(el, item, data) {
    const index = data[0].results.indexOf(item);
    data[0].results[index][el] = "";
    render(data);
}

// закрытие контекстного меню
document.onclick = (e) => {
    if (document.getElementById('check')) document.getElementById('check').removeAttribute('id')
}

// механизм отображения данных при перезагрузке страницы
window.onload = function() {
    const data = JSON.parse(sessionStorage.getItem('data'));
    page = +sessionStorage.getItem('page')
    if (data) {
        changePage(data);
        render(data)
    }
}

// механизм drag&drop
function handleDragStart(event) {
    this.style.opacity = '0.4';
    dragSrcEl = this;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', this.innerHTML);
}
function handleDragOver(event) {
    if (event.preventDefault) {
        event.preventDefault();
    }
    return false;
}
function handleDragEnter(event) {
    this.classList.add('over');
}
function handleDragLeave(event) {
    this.classList.remove('over');
}
function handleDragEnd(event) {
    this.style.opacity = '1';
    let items = document.querySelectorAll('tbody tr');
    items.forEach(function (item) {
        item.classList.remove('over');
    });
}
function handleDrop(event, data) {
    event.stopPropagation();
    if (dragSrcEl !== this) {
        dragSrcEl.innerHTML = this.innerHTML;
        this.innerHTML = event.dataTransfer.getData('text/html');
        
        let data = JSON.parse(sessionStorage.getItem('data'));
        const index = [...dragSrcEl.parentElement.childNodes].indexOf(dragSrcEl);
        const indexNew = [...this.parentElement.childNodes].indexOf(this);
        [data[0].results[index], data[0].results[indexNew]] = [data[0].results[indexNew], data[0].results[index]];
        sessionStorage.setItem('data', JSON.stringify(data))
        render(data)
    }
    return false;
}