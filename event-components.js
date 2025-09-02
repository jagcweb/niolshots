// Componentes para eventos del partido
// Funcionalidad equivalente a LazyColumnPlayers.kt

// Enum para tipo de datos a mostrar
const DataType = {
  SHOTS_GOALS: "shots_goals",
  FOULS_CARDS: "fouls_cards",
  SAVES: "saves"
};

// Función para generar tabla de tiros y goles con buscador
function createShotsAndGoalsList(container, shots, homeColor, awayColor) {
  container.innerHTML = '';
  
  if (!shots || shots.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-futbol"></i>
        <span>No hay datos de tiros disponibles</span>
      </div>
    `;
    return;
  }

  // Establecer variables CSS para colores de equipo
  document.documentElement.style.setProperty('--home-color', homeColor);
  document.documentElement.style.setProperty('--away-color', awayColor);

  // Ordenar por tiempo descendente (más reciente primero)
  const sortedShots = [...shots].sort((a, b) => b.time - a.time);
  
  // Depurar el primer objeto para ver su estructura
  if (sortedShots.length > 0) {
    console.log("Estructura del objeto shot:", sortedShots[0]);
  }
  
  // Crear contenedor principal
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'shots-table-wrapper';
  
  // Crear buscador
  const searchContainer = document.createElement('div');
  searchContainer.className = 'shots-table-search';
  searchContainer.innerHTML = `
    <div class="search-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </div>
    <input type="text" id="player-search" placeholder="Buscar por nombre de jugador..." autocomplete="off">
    <button type="button" class="search-clear" aria-label="Limpiar búsqueda">×</button>
    <div class="search-results"></div>
  `;
  
  // Crear contenedor para la tabla
  const tableContainer = document.createElement('div');
  tableContainer.className = 'shots-table-container';
  
  // Crear tabla
  const table = document.createElement('table');
  table.className = 'shots-table';
  table.id = 'shots-data-table';
  
  // Crear encabezado de tabla
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="col-time">Min</th>
      <th class="col-player">Jugador</th>
      <th class="col-type">Tipo</th>
      <th class="col-xg">xG</th>
      <th class="col-body">Parte</th>
      <th class="col-assist">Asistencia</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Crear cuerpo de tabla
  const tbody = document.createElement('tbody');
  
  sortedShots.forEach(shot => {
    const isHome = shot.isHome;
    const row = document.createElement('tr');
    row.className = isHome ? 'home-row' : 'away-row';
    row.dataset.playerName = (shot.player?.name || shot.playerName || '').toLowerCase();
    row.dataset.assistName = shot.hasAssist && shot.assistPlayer ? shot.assistPlayer.name.toLowerCase() : '';
    
    // Si es gol, añadir clase especial
    if (shot.shotType?.toLowerCase() === "goal") {
      row.classList.add('goal-row');
    }
    
    // Determinar tipo de tiro e icono
    let shotTypeText = "";
    let shotIcon = "";
    
    switch ((shot.shotType || "").toLowerCase()) {
      case "goal":
      shotTypeText = "Gol";
      shotIcon = "⚽";
      break;
      case "ontarget":
      case "on_target":
      case "save":
      shotTypeText = "Tiro a puerta";
      shotIcon = "🎯";
      break;
      case "miss":
      case "offtarget":
      case "off_target":
      shotTypeText = "Tiro fuera";
      shotIcon = "❌";
      break;
      default:
      shotTypeText = "Tiro fuera";
      shotIcon = "❌";
    }
    
    // Determinar parte del cuerpo
    let bodyPartText = "";
    if (shot.bodyPart) {
      const bodyPartLower = shot.bodyPart.toLowerCase();
      switch (true) {
        case bodyPartLower.includes("right") && bodyPartLower.includes("foot"):
          bodyPartText = "Pie derecho";
          break;
        case bodyPartLower.includes("left") && bodyPartLower.includes("foot"):
          bodyPartText = "Pie izquierdo";
          break;
        case bodyPartLower.includes("head"):
          bodyPartText = "Cabeza";
          break;
        case bodyPartLower.includes("other"):
          bodyPartText = "Otra parte";
          break;
        default:
          bodyPartText = shot.bodyPart;
      }
    }
    
    // Manejar correctamente el valor xG - probar múltiples propiedades posibles
    let xgValue = '-';
    
    // Intentar diferentes nombres de propiedad para xG
    if (shot.xG !== undefined && shot.xG !== null) {
      // Intentar con xG (mayúscula)
      const value = parseFloat(shot.xG);
      if (!isNaN(value)) {
        xgValue = `<span class="xg-value">${value.toFixed(2)}</span>`;
      }
    } else if (shot.xg !== undefined && shot.xg !== null) {
      // Intentar con xg (minúscula)
      const value = parseFloat(shot.xg);
      if (!isNaN(value)) {
        xgValue = `<span class="xg-value">${value.toFixed(2)}</span>`;
      }
    } else if (shot.expected_goals !== undefined && shot.expected_goals !== null) {
      // Intentar con expected_goals
      const value = parseFloat(shot.expected_goals);
      if (!isNaN(value)) {
        xgValue = `<span class="xg-value">${value.toFixed(2)}</span>`;
      }
    } else if (shot.expectedGoals !== undefined && shot.expectedGoals !== null) {
      // Intentar con expectedGoals (camelCase)
      const value = parseFloat(shot.expectedGoals);
      if (!isNaN(value)) {
        xgValue = `<span class="xg-value">${value.toFixed(2)}</span>`;
      }
    }
    
    // Construir contenido de la fila
    row.innerHTML = `
      <td class="col-time"><span class="time-badge">${shot.time}'</span></td>
      <td class="col-player"><span class="player-name">${shot.player?.name || shot.playerName || 'Desconocido'}</span></td>
      <td class="col-type"><span class="shot-type">${shotIcon} ${shotTypeText}</span></td>
      <td class="col-xg">${xgValue}</td>
      <td class="col-body">${bodyPartText || '-'}</td>
      <td class="col-assist">${shot.shotType?.toLowerCase() === "goal" && shot.hasAssist && shot.assistPlayer ? 
        shot.assistPlayer.name : '-'}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  
  // Añadir todo al contenedor principal
  tableWrapper.appendChild(searchContainer);
  tableWrapper.appendChild(tableContainer);
  container.appendChild(tableWrapper);
  
  // Implementar la funcionalidad de búsqueda
  const searchInput = tableWrapper.querySelector('#player-search');
  const clearButton = tableWrapper.querySelector('.search-clear');
  const searchResults = tableWrapper.querySelector('.search-results');
  const rows = tbody.querySelectorAll('tr');
  
  // Función de búsqueda
  function filterTable() {
    const searchText = searchInput.value.toLowerCase().trim();
    let matchCount = 0;
    
    if (searchText === '') {
      rows.forEach(row => {
        row.classList.remove('no-match-row');
        // Eliminar destacado si existía
        const playerCell = row.querySelector('.col-player');
        const assistCell = row.querySelector('.col-assist');
        if (playerCell) playerCell.innerHTML = `<span class="player-name">${playerCell.textContent}</span>`;
        if (assistCell && assistCell.innerHTML !== '-') assistCell.innerHTML = assistCell.textContent;
      });
      
      searchContainer.classList.remove('has-text');
      searchResults.classList.remove('has-results');
      return;
    }
    
    searchContainer.classList.add('has-text');
    
    rows.forEach(row => {
      const playerName = row.dataset.playerName;
      const assistName = row.dataset.assistName;
      
      if (playerName.includes(searchText) || assistName.includes(searchText)) {
        row.classList.remove('no-match-row');
        matchCount++;
        
        // Destacar coincidencias
        const playerCell = row.querySelector('.col-player');
        const assistCell = row.querySelector('.col-assist');
        
        if (playerName.includes(searchText)) {
          const htmlContent = playerCell.textContent.replace(
            new RegExp(`(${searchText})`, 'gi'),
            '<span class="highlight-match">$1</span>'
          );
          playerCell.innerHTML = htmlContent;
        }
        
        if (assistName.includes(searchText) && assistCell.textContent !== '-') {
          const htmlContent = assistCell.textContent.replace(
            new RegExp(`(${searchText})`, 'gi'),
            '<span class="highlight-match">$1</span>'
          );
          assistCell.innerHTML = htmlContent;
        }
      } else {
        row.classList.add('no-match-row');
      }
    });
    
    if (matchCount > 0) {
      searchResults.innerHTML = `Se encontraron ${matchCount} coincidencias.`;
      searchResults.classList.add('has-results');
    } else {
      searchResults.innerHTML = `No se encontraron coincidencias para "${searchInput.value}".`;
      searchResults.classList.add('has-results');
    }
  }
  
  // Eventos para la búsqueda
  searchInput.addEventListener('input', filterTable);
  
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    filterTable();
    searchInput.focus();
  });
  
  // Prevenir envío de formulario
  searchInput.form?.addEventListener('submit', (e) => {
    e.preventDefault();
  });
}

// Función para generar tabla de faltas y tarjetas con buscador
function createFoulsAndCardsList(container, fouls, homeColor, awayColor) {
  container.innerHTML = '';
  
  if (!fouls || fouls.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-hand"></i>
        <span>No hay datos de faltas disponibles</span>
      </div>
    `;
    return;
  }

  // Establecer variables CSS para colores de equipo
  document.documentElement.style.setProperty('--home-color', homeColor);
  document.documentElement.style.setProperty('--away-color', awayColor);

  // Ordenar por tiempo descendente (más reciente primero)
  const sortedFouls = [...fouls].sort((a, b) => b.time - a.time);
  
  // Crear contenedor principal
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'shots-table-wrapper';
  
  // Crear buscador
  const searchContainer = document.createElement('div');
  searchContainer.className = 'shots-table-search';
  searchContainer.innerHTML = `
    <div class="search-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </div>
    <input type="text" id="player-search-fouls" placeholder="Buscar por nombre de jugador..." autocomplete="off">
    <button type="button" class="search-clear" aria-label="Limpiar búsqueda">×</button>
    <div class="search-results"></div>
  `;
  
  // Crear contenedor para la tabla
  const tableContainer = document.createElement('div');
  tableContainer.className = 'shots-table-container';
  
  // Crear tabla
  const table = document.createElement('table');
  table.className = 'shots-table';
  table.id = 'fouls-data-table';
  
  // Crear encabezado de tabla
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="col-time">Min</th>
      <th class="col-player">Jugador</th>
      <th class="col-type">Tipo</th>
      <th class="col-details">Detalles</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Crear cuerpo de tabla
  const tbody = document.createElement('tbody');
  
  sortedFouls.forEach(foul => {
    const isHome = foul.isHome || foul.team === 'home-team';
    const row = document.createElement('tr');
    row.className = isHome ? 'home-row' : 'away-row';
    row.dataset.playerName = (foul.player?.name || foul.playerName || '').toLowerCase();
    
    // Determinar tipo de falta/tarjeta e iconos
    let foulTypeText = "";
    let foulIcon = "";
    let specialClass = "";
    
    const foulType = foul.foulType?.toLowerCase() || "";
    
    if (foulType.includes("roja") && foulType.includes("doble amarilla")) {
      foulTypeText = "2ª Amarilla";
      foulIcon = "🟨🟥";
      specialClass = "card-red";
      row.classList.add('card-red-row');
    } else if (foulType.includes("roja")) {
      foulTypeText = "Tarjeta roja";
      foulIcon = "🟥";
      specialClass = "card-red";
      row.classList.add('card-red-row');
    } else if (foulType.includes("amarilla")) {
      foulTypeText = "Tarjeta amarilla";
      foulIcon = "🟨";
      specialClass = "card-yellow";
      row.classList.add('card-yellow-row');
    } else if (foulType.includes("tarjeta")) {
      foulTypeText = "Tarjeta";
      foulIcon = "🟨";
      specialClass = "card-yellow";
      row.classList.add('card-yellow-row');
    } else {
      foulTypeText = "Falta";
      foulIcon = "⚠️";
    }
    
    // Detalles adicionales
    let details = "";
    if (foulType.includes("doble amarilla")) {
      details = "Expulsión por doble amonestación";
    } else if (foul.description) {
      details = foul.description;
    }
    
    // Construir contenido de la fila
    row.innerHTML = `
      <td class="col-time"><span class="time-badge">${foul.time}'</span></td>
      <td class="col-player"><span class="player-name">${foul.player?.name || foul.playerName || 'Desconocido'}</span></td>
      <td class="col-type"><span class="foul-type">${foulIcon} ${foulTypeText}</span></td>
      <td class="col-details">${details || '-'}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  
  // Añadir todo al contenedor principal
  tableWrapper.appendChild(searchContainer);
  tableWrapper.appendChild(tableContainer);
  container.appendChild(tableWrapper);
  
  // Implementar la funcionalidad de búsqueda
  const searchInput = tableWrapper.querySelector('#player-search-fouls');
  const clearButton = tableWrapper.querySelector('.search-clear');
  const searchResults = tableWrapper.querySelector('.search-results');
  const rows = tbody.querySelectorAll('tr');
  
  // Función de búsqueda
  function filterTable() {
    const searchText = searchInput.value.toLowerCase().trim();
    let matchCount = 0;
    
    if (searchText === '') {
      rows.forEach(row => {
        row.classList.remove('no-match-row');
        // Eliminar destacado si existía
        const playerCell = row.querySelector('.col-player');
        if (playerCell) playerCell.innerHTML = `<span class="player-name">${playerCell.textContent}</span>`;
      });
      
      searchContainer.classList.remove('has-text');
      searchResults.classList.remove('has-results');
      return;
    }
    
    searchContainer.classList.add('has-text');
    
    rows.forEach(row => {
      const playerName = row.dataset.playerName;
      
      if (playerName.includes(searchText)) {
        row.classList.remove('no-match-row');
        matchCount++;
        
        // Destacar coincidencias
        const playerCell = row.querySelector('.col-player');
        
        if (playerName.includes(searchText)) {
          const htmlContent = playerCell.textContent.replace(
            new RegExp(`(${searchText})`, 'gi'),
            '<span class="highlight-match">$1</span>'
          );
          playerCell.innerHTML = htmlContent;
        }
      } else {
        row.classList.add('no-match-row');
      }
    });
    
    if (matchCount > 0) {
      searchResults.innerHTML = `Se encontraron ${matchCount} coincidencias.`;
      searchResults.classList.add('has-results');
    } else {
      searchResults.innerHTML = `No se encontraron coincidencias para "${searchInput.value}".`;
      searchResults.classList.add('has-results');
    }
  }
  
  // Eventos para la búsqueda
  searchInput.addEventListener('input', filterTable);
  
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    filterTable();
    searchInput.focus();
  });
  
  // Prevenir envío de formulario
  searchInput.form?.addEventListener('submit', (e) => {
    e.preventDefault();
  });
}

// Función para generar tabla de paradas con buscador
function createSavesList(container, saves, homeColor, awayColor) {
  container.innerHTML = '';
  
  if (!saves || saves.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-hand"></i>
        <span>No hay datos de paradas disponibles</span>
      </div>
    `;
    return;
  }

  // Establecer variables CSS para colores de equipo
  document.documentElement.style.setProperty('--home-color', homeColor);
  document.documentElement.style.setProperty('--away-color', awayColor);

  // Ordenar por tiempo descendente (más reciente primero)
  const sortedSaves = [...saves].sort((a, b) => b.time - a.time);
  
  // Crear contenedor principal
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'shots-table-wrapper';
  
  // Crear buscador
  const searchContainer = document.createElement('div');
  searchContainer.className = 'shots-table-search';
  searchContainer.innerHTML = `
    <div class="search-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </div>
    <input type="text" id="player-search-saves" placeholder="Buscar por nombre de jugador..." autocomplete="off">
    <button type="button" class="search-clear" aria-label="Limpiar búsqueda">×</button>
    <div class="search-results"></div>
  `;
  
  // Crear contenedor para la tabla
  const tableContainer = document.createElement('div');
  tableContainer.className = 'shots-table-container';
  
  // Crear tabla
  const table = document.createElement('table');
  table.className = 'shots-table';
  table.id = 'saves-data-table';
  
  // Crear encabezado de tabla
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="col-time">Min</th>
      <th class="col-player">Portero</th>
      <th class="col-type">Tipo</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Crear cuerpo de tabla
  const tbody = document.createElement('tbody');
  
  sortedSaves.forEach(save => {
    const isHome = save.isHome || save.team === 'home-team';
    const row = document.createElement('tr');
    row.className = isHome ? 'home-row' : 'away-row';
    row.dataset.playerName = (save.player?.name || save.playerName || '').toLowerCase();
    row.dataset.shotPlayer = (save.shotPlayer || '').toLowerCase();
    row.classList.add('save-row');
    
    let saveTypeText = save.saveType || "Parada";
    let saveIcon = "🧤";
    
    // Construir contenido de la fila
    row.innerHTML = `
      <td class="col-time"><span class="time-badge">${save.time}'</span></td>
      <td class="col-player"><span class="player-name">${save.player?.name || save.playerName || 'Desconocido'}</span></td>
      <td class="col-type"><span class="save-type">${saveIcon} ${saveTypeText}</span></td>
      <td class="col-against">${save.shotPlayer || '-'}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  
  // Añadir todo al contenedor principal
  tableWrapper.appendChild(searchContainer);
  tableWrapper.appendChild(tableContainer);
  container.appendChild(tableWrapper);
  
  // Implementar la funcionalidad de búsqueda
  const searchInput = tableWrapper.querySelector('#player-search-saves');
  const clearButton = tableWrapper.querySelector('.search-clear');
  const searchResults = tableWrapper.querySelector('.search-results');
  const rows = tbody.querySelectorAll('tr');
  
  // Función de búsqueda
  function filterTable() {
    const searchText = searchInput.value.toLowerCase().trim();
    let matchCount = 0;
    
    if (searchText === '') {
      rows.forEach(row => {
        row.classList.remove('no-match-row');
        // Eliminar destacado si existía
        const playerCell = row.querySelector('.col-player');
        const againstCell = row.querySelector('.col-against');
        if (playerCell) playerCell.innerHTML = `<span class="player-name">${playerCell.textContent}</span>`;
        if (againstCell && againstCell.innerHTML !== '-') againstCell.innerHTML = againstCell.textContent;
      });
      
      searchContainer.classList.remove('has-text');
      searchResults.classList.remove('has-results');
      return;
    }
    
    searchContainer.classList.add('has-text');
    
    rows.forEach(row => {
      const playerName = row.dataset.playerName;
      const shotPlayer = row.dataset.shotPlayer;
      
      if (playerName.includes(searchText) || shotPlayer.includes(searchText)) {
        row.classList.remove('no-match-row');
        matchCount++;
        
        // Destacar coincidencias
        const playerCell = row.querySelector('.col-player');
        const againstCell = row.querySelector('.col-against');
        
        if (playerName.includes(searchText)) {
          const htmlContent = playerCell.textContent.replace(
            new RegExp(`(${searchText})`, 'gi'),
            '<span class="highlight-match">$1</span>'
          );
          playerCell.innerHTML = htmlContent;
        }
        
        if (shotPlayer.includes(searchText) && againstCell.textContent !== '-') {
          const htmlContent = againstCell.textContent.replace(
            new RegExp(`(${searchText})`, 'gi'),
            '<span class="highlight-match">$1</span>'
          );
          againstCell.innerHTML = htmlContent;
        }
      } else {
        row.classList.add('no-match-row');
      }
    });
    
    if (matchCount > 0) {
      searchResults.innerHTML = `Se encontraron ${matchCount} coincidencias.`;
      searchResults.classList.add('has-results');
    } else {
      searchResults.innerHTML = `No se encontraron coincidencias para "${searchInput.value}".`;
      searchResults.classList.add('has-results');
    }
  }
  
  // Eventos para la búsqueda
  searchInput.addEventListener('input', filterTable);
  
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    filterTable();
    searchInput.focus();
  });
  
  // Prevenir envío de formulario
  searchInput.form?.addEventListener('submit', (e) => {
    e.preventDefault();
  });
}

function setupEventsComponent(tabContent, matchSummary, homeColor, awayColor) {
  // Obtener el ID del partido
  const matchId = matchSummary.id || matchSummary.matchId;
  
  // Crear contenedor para el selector y los eventos
  tabContent.innerHTML = `
    <div class="events-selector">
      <select id="event-type-selector" class="event-type-dropdown">
        <option value="${DataType.SHOTS_GOALS}">Tiros y Goles</option>
        <option value="${DataType.FOULS_CARDS}">Faltas y Tarjetas</option>
        <option value="${DataType.SAVES}">Paradas</option>
      </select>
    </div>
    <div id="events-container" class="events-container"></div>
  `;

  const selector = document.getElementById('event-type-selector');
  const eventsContainer = document.getElementById('events-container');

  // Establecer variables CSS para colores de equipo
  document.documentElement.style.setProperty('--home-color', homeColor);
  document.documentElement.style.setProperty('--away-color', awayColor);

  // Verificar si hay un tipo de evento guardado en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const savedEventType = urlParams.get('eventType');
  
  // Establecer el tipo de evento desde la URL o usar el predeterminado
  if (savedEventType && Object.values(DataType).includes(savedEventType)) {
    selector.value = savedEventType;
  }
  
  // Mostrar datos según el tipo de evento seleccionado
  const selectedValue = selector.value;
  switch (selectedValue) {
    case DataType.SHOTS_GOALS:
      createShotsAndGoalsList(eventsContainer, matchSummary.shots, homeColor, awayColor);
      break;
    case DataType.FOULS_CARDS:
      createFoulsAndCardsList(eventsContainer, matchSummary.fouls, homeColor, awayColor);
      break;
    case DataType.SAVES:
      createSavesList(eventsContainer, matchSummary.saves, homeColor, awayColor);
      break;
  }

  // Configurar cambio de tipo de evento
  selector.addEventListener('change', function() {
    const selectedValue = this.value;
    
    // Actualizar la URL con el tipo de evento seleccionado
    const url = new URL(window.location);
    url.searchParams.set('eventType', selectedValue);
    
    // Asegurar que el matchId se mantiene en la URL
    if (matchId) {
      url.searchParams.set('matchId', matchId);
    }
    
    window.history.replaceState({}, '', url);
    
    switch (selectedValue) {
      case DataType.SHOTS_GOALS:
        createShotsAndGoalsList(eventsContainer, matchSummary.shots, homeColor, awayColor);
        break;
      case DataType.FOULS_CARDS:
        createFoulsAndCardsList(eventsContainer, matchSummary.fouls, homeColor, awayColor);
        break;
      case DataType.SAVES:
        createSavesList(eventsContainer, matchSummary.saves, homeColor, awayColor);
        break;
    }
  });
}