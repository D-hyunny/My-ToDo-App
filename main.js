// 할 일 목록 앱 진입점
function initApp() {
    // 화면 요소 가져오기
    const formEl = document.getElementById('todo-form');
    const inputEl = document.getElementById('todo-input');
    const listEl = document.getElementById('todo-list');
    const totalEl = document.getElementById('total-count');
    const doneEl = document.getElementById('done-count');
    const filtersEl = document.getElementById('filters');
    const clearBtn = document.getElementById('clear-completed');

    // 필터별 표시 조건과, 해당 항목이 없을 때 보여 줄 문구
    const FILTERS = {
        all: { match: () => true, empty: '아직 할 일이 없습니다' },
        active: { match: (item) => !item.completed, empty: '진행중인 할 일이 없습니다' },
        completed: { match: (item) => item.completed, empty: '완료된 할 일이 없습니다' },
    };
    // 현재 선택된 필터 (저장하지 않으므로 새로고침하면 전체로 돌아감)
    let currentFilter = 'all';

    // LocalStorage에 저장할 때 쓰는 키
    const STORAGE_KEY = 'todo-app.todos';

    // 저장된 할 일 불러오기 (없거나 읽을 수 없으면 빈 배열)
    function loadTodos() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            return [];
        }
    }

    // 현재 배열을 LocalStorage에 저장
    function saveTodos() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        } catch (error) {
            // 저장소를 쓸 수 없는 환경이면 메모리에만 유지한다
            console.warn('할 일을 저장하지 못했습니다.', error);
        }
    }

    // 할 일 배열 (LocalStorage에서 복원)
    // 항목 형태: { id: 숫자, text: 문자열, completed: 불리언 }
    let todos = loadTodos();
    // 항목마다 붙일 고유 번호 (저장된 항목의 가장 큰 번호 다음부터)
    let nextId = todos.reduce((max, item) => Math.max(max, item.id), 0) + 1;

    // 항목 하나에 해당하는 <li> 요소 만들기
    function createItemEl(todo) {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.classList.toggle('completed', todo.completed);
        li.dataset.id = todo.id;

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.className = 'todo-check';
        check.checked = todo.completed;
        check.setAttribute('aria-label', '완료 표시');

        // 입력 내용은 textContent로 넣어 HTML로 해석되지 않게 한다
        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = todo.text;

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'btn-delete';
        del.textContent = '×';
        del.setAttribute('aria-label', '삭제');

        li.append(check, text, del);
        return li;
    }

    // 배열 내용을 화면에 다시 그리기
    function render() {
        // 현재 필터에 맞는 항목만 표시
        const filter = FILTERS[currentFilter];
        listEl.dataset.empty = filter.empty;
        listEl.replaceChildren(...todos.filter(filter.match).map(createItemEl));

        // 전체/완료 개수 갱신 (필터와 무관하게 전체 기준)
        const doneCount = todos.filter((item) => item.completed).length;
        totalEl.textContent = todos.length;
        doneEl.textContent = doneCount;

        // 선택된 필터 버튼 강조
        filtersEl.querySelectorAll('.btn-filter').forEach((btn) => {
            const selected = btn.dataset.filter === currentFilter;
            btn.classList.toggle('active', selected);
            btn.setAttribute('aria-pressed', selected);
        });

        // 완료된 항목이 없으면 일괄 삭제 버튼 비활성화
        clearBtn.disabled = doneCount === 0;
    }

    // 배열이 바뀐 뒤 호출: 저장하고 화면 갱신
    function commit() {
        saveTodos();
        render();
    }

    // 할 일 추가
    function addTodo() {
        const text = inputEl.value.trim();

        // 빈 값(공백만 입력한 경우 포함)이면 알림
        if (text === '') {
            alert('할 일을 입력하세요');
            inputEl.focus();
            return;
        }

        // 같은 내용의 할 일이 이미 있으면 알림
        if (todos.some((item) => item.text === text)) {
            alert('이미 등록된 할 일입니다');
            inputEl.focus();
            return;
        }

        todos.push({ id: nextId, text: text, completed: false });
        nextId += 1;

        inputEl.value = '';
        inputEl.focus();
        commit();
    }

    // 완료/미완료 토글
    function toggleTodo(id) {
        const todo = todos.find((item) => item.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            commit();
        }
    }

    // 할 일 삭제
    function deleteTodo(id) {
        todos = todos.filter((item) => item.id !== id);
        commit();
    }

    // 완료된 항목 일괄 삭제
    function clearCompleted() {
        todos = todos.filter((item) => !item.completed);
        commit();
    }

    // 이벤트가 일어난 항목의 id 찾기
    function getItemId(target) {
        const li = target.closest('.todo-item');
        return li ? Number(li.dataset.id) : null;
    }

    // 추가 버튼 클릭과 Enter 키 모두 폼 submit으로 처리
    formEl.addEventListener('submit', (event) => {
        // 페이지가 새로고침되지 않게 기본 동작 막기
        event.preventDefault();
        addTodo();
    });

    // 체크박스 변경: 완료 토글 (목록에 이벤트 위임)
    listEl.addEventListener('change', (event) => {
        if (event.target.classList.contains('todo-check')) {
            toggleTodo(getItemId(event.target));
        }
    });

    // 삭제 버튼 클릭: 항목 제거 (목록에 이벤트 위임)
    listEl.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-delete')) {
            deleteTodo(getItemId(event.target));
        }
    });

    // 필터 버튼 클릭: 해당 항목만 표시 (저장할 내용이 없으므로 화면만 갱신)
    filtersEl.addEventListener('click', (event) => {
        const btn = event.target.closest('.btn-filter');
        if (btn) {
            currentFilter = btn.dataset.filter;
            render();
        }
    });

    // 완료된 항목 삭제 버튼 클릭
    clearBtn.addEventListener('click', clearCompleted);

    render();
}

// 문서 로딩이 끝나면 앱 실행
document.addEventListener('DOMContentLoaded', initApp);
