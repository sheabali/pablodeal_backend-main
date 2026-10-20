BallTap
ENGLISH VERSION
FUNCTIONAL SPECIFICATION – LEAGUE MODE
Objective
The application must include a game mode called League, in which several users compete
against each other, simulating a real football competition.
Participants will play matches throughout a season made up of matchdays, accumulating points
in a general standings table until a champion is determined at the end of the competition.
⸻

1. CREATING THE LEAGUE
   A user will be able to create a private league from within the application.
   During league creation, they must be able to configure:
   • League name.
   • Matchday start time.
   • Competition start date.
   Once created, the application will automatically generate:
   • A unique invitation code.
   • A shareable invitation link.
   The league will remain in a Pending start state until the administrator decides to begin it.
   ⸻
2. ADDING PLAYERS
   Users will be able to join the league freely through:
   • Invitation code.
   • Invitation link.
   There will be no predefined limit on the number of participants.
   Players will be able to keep joining as long as the league remains in the Pending start state.
   When joining a league, each participant must configure:
   • Team name.
   • Team image or crest.
   This information will appear in:
   • Standings.
   • Schedule.
   • Results.
   • Statistics.
   • Team profile.
   ⸻
3. STARTING THE LEAGUE
   The league creator will be the competition administrator.
   While the league is pending start, the administrator will be able to view all registered teams.
   When they consider all the necessary participants to be present, they will be able to press the
   Start League button.
   When this button is pressed:
   • Registrations will be closed automatically.
   • No new teams will be able to join.
   • The complete schedule will be generated automatically.
   • All necessary matchdays will be created.
   • The league will move to the Active state.
   ⸻
4. SCHEDULE GENERATION
   The application must automatically generate the complete schedule once the league has
   started.
   All teams must face each other.
   The generation of matchdays must adapt automatically to the number of registered participants.
   If the number of participants is odd:
   • One team will have a bye (rest) each matchday.
   • The bye will rotate automatically among all participants.
   ⸻
5. MATCHDAY SYSTEM
   The competition will be organized into matchdays.
   Each matchday will have:
   • Start date.
   • Start time.
   • A fixed duration of 24 hours.
   Examples:
   • Start at 10:00 → closes at 10:00 the following day.
   • Start at 15:00 → closes at 15:00 the following day.
   • Start at 21:00 → closes at 21:00 the following day.
   When a matchday becomes active:
   • The corresponding matches will be enabled automatically.
   • Players will receive a notification.
   When the 24 hours end:
   • The matchday will close automatically.
   • No further attempts can be made.
   • Results and standings will be updated.
   • The next matchday will be enabled.
   ⸻
6. MATCH FORMAT
   Matches will be asynchronous.
   It will not be necessary for both players to be connected at the same time.
   Each participant will be able to play their match at any point within the available 24 hours.
   Example:
   • Player A plays at 17:00.
   • Player B plays at 20:00.
   The system will store both results and automatically determine the winner.
   ⸻
7. ATTEMPTS SYSTEM
   Each player will initially have:
   • 2 free attempts per matchday.
   In addition, they will be able to obtain:
   • 1 additional attempt by watching a rewarded ad.
   Therefore, each player will have up to 3 attempts at no direct monetary cost.
   Each attempt will consist of a full 1-minute game.
   Paid additional attempts
   The application must allow the purchase of additional attempt packs during an active matchday.
   Proposed initial configuration:
   • 2 additional attempts for €1.
   These attempts will be added automatically to the player's available attempts for that matchday.
   Example:
   • 2 free attempts.
   • 1 attempt via ad.
   • Purchase of 2 extra attempts for €1.
   Total available for that matchday: 5 attempts.
   Official result
   The system will always keep the best score obtained by the player during the matchday.
   Each new attempt may improve the previous score, but will never worsen it.
   Future configuration
   Prices and attempt quantities must be parameterized so they can be modified in future versions
   without requiring code changes.
   ⸻
8. OFFICIAL MATCH RESULT
   When both players have completed their attempts, or once the matchday has ended, their best
   results will be compared.
   The official match result will be the best record achieved by each player during the matchday.
   ⸻
9. DETERMINING THE RESULT
   If a player scores more goals than their opponent:
   • They win the match.
   If both score the same number of goals:
   • The match ends in a draw.
   ⸻
10. POINTS SYSTEM
    The standings will follow the traditional football system.
    • Win = 3 points.
    • Draw = 1 point.
    • Loss = 0 points.
    ⸻
11. INACTIVITY MANAGEMENT
    One player does not participate
    If a player does not make any attempt during the matchday:
    • They automatically lose the match.
    • A result of 0-3 is recorded.
    • The opponent gets an automatic win.
    • The opponent receives 3 points.
    Neither player participates
    If neither of the two players makes any attempts during the matchday:
    • Both will be given a 0-3 loss.
    • Neither will receive any points.
    ⸻
12. STANDINGS
    The league must display standings that are updated automatically after each matchday.
    Each team must display:
    • Position.
    • Team name.
    • Team crest or image.
    • Matches played.
    • Wins.
    • Draws.
    • Losses.
    • Goals for.
    • Goals against.
    • Goal difference.
    • Points.
    ⸻
13. TIEBREAKER CRITERIA
    If two or more teams finish the season with the same number of points, the standings will be
    resolved in the following order:
14. Head-to-head goal difference
    The result of the direct matchups between the tied teams.
15. Overall goal difference
    The difference between goals for and goals against across the entire season.
    ⸻
16. NEXT MATCHDAY PREVIEW
    Once a player has finished their participation in the current matchday, the application must
    automatically display information about their next match.
    The information shown must include:
    • Next matchday's opponent.
    • Opponent's crest or image.
    • Next matchday number.
    • Start date.
    • Start time.
    • Countdown to the start of the next matchday.
    Users will also be able to check at any time:
    • Current matchday.
    • Next matchday.
    • Complete season schedule.
    • Results from previous matchdays.
    ⸻
17. REAL-TIME RESULTS VISIBILITY
    During a matchday's active period, the results obtained by each player must be immediately
    visible to their opponent.
    Each time a player completes an attempt, the application will automatically update the match
    information.
    Information visible during the match
    Each participant will be able to check at all times:
    • Opponent's current best result.
    • Number of attempts used by the opponent.
    • Time of the opponent's last attempt.
    • Provisional result of the matchup.
    Attempts history
    Each match must store and display the complete history of attempts made by both players.
    For each attempt, the following will be shown:
    • Attempt number.
    • Time it was made.
    • Goals scored.
    Permanent access
    Once the matchday has ended, this data will not disappear.
    The results and history of each match must remain stored permanently.
    ⸻
18. LEAGUE-WIDE MATCHDAY TRACKING
    The application must include a section called "Matchday Live," accessible to all league
    participants.
    This section will allow real-time viewing of all matches in the current matchday.
    Information shown per match
    • Names of both teams.
    • Crests of both teams.
    • Current best result of each player.
    • Provisional result.
    • Number of attempts used by each player.
    • Match status.
    Possible statuses
    • Pending.
    • In play.
    • Finished.
    • Automatic win by no-show.
    Provisional standings
    During the matchday, provisional standings may be displayed based on the results occurring in
    real time.
    The official standings will only be updated at the close of the matchday.
    Matchday activity
    The application may include a real-time activity feed with events such as:
    • FC Pablo just scored 12 goals.
    • FC Ernesto overtakes FC Pablo.
    • FC Carlos has used an additional attempt.
    • FC Álvaro has finished their participation.
    ⸻
19. END OF SEASON
    The season will end automatically once all scheduled matchdays have been played.
    At the end:
    • The competition will be locked.
    • The final standings will be displayed.
    • The team in first position will be crowned champion.
    • The complete season history will be preserved.
    ⸻
20. MONETIZATION OPTIONS
    18.1 Rewarded ad
    Each player will be able to obtain 1 additional attempt per matchday by watching an ad.
    18.2 Purchase of additional attempts
    Initial configuration:
    • 2 additional attempts for €1.
    Prices must be configurable from the admin panel.
    18.3 Premium subscription
    Possible monthly subscription with benefits such as:
    • Ad removal.
    • Additional attempts included.
    • Advanced statistics.
    • Premium badge.
    • Exclusive customization.
    18.4 Team customization
    Cosmetic elements:
    • Exclusive fields/pitches.
    • Profile frames.
    • Special balls.
    • Visual themes.
    These options will not grant competitive advantages.
    18.5 Premium leagues in future versions
    Possibility of creating leagues with advanced features:
    • Competition customization.
    • Expanded statistics.
    • Advanced history.
    18.6 Virtual currency in future versions
    Internal currency system for:
    • Customization.
    • Special events.
    • Content unlocking.
    18.7 Special competitions in future versions
    Possible future implementation of:
    • Knockout cups.
    • Special tournaments.
    • Champions League between leagues.
    • Time-limited events.
    ⸻
    SUMMARY
    • Private leagues via code or link.
    • Registrations open until the administrator presses Start League.
    • Custom teams with name and crest.
    • 24-hour matchdays.
    • Asynchronous matches.
    • Results visible in real time.
    • Live tracking of the entire matchday.
    • Permanent history of matches and attempts.
    • 2 free attempts + 1 via ad.
    • Purchase of additional attempts (2 for €1 initially).
    • Automatic standings and tiebreaker criteria.
    • Complete schedule visible.
    • Scalable monetization for future versions.
    VERSION ESPAÑOLA
    ESPECIFICACIÓN FUNCIONAL – MODO LIGA
    Objetivo
    La aplicación deberá incluir un modo de juego denominado Liga, en el que varios usuarios
    compitan entre sí simulando una competición de fútbol real.
    Los participantes disputarán partidos a lo largo de una temporada compuesta por jornadas,
    acumulando puntos en una clasificación general hasta determinar un campeón al finalizar la
    competición.
    ⸻
21. CREACIÓN DE LA LIGA
    Un usuario podrá crear una liga privada desde la aplicación.
    Durante la creación de la liga deberá poder configurar:

- Nombre de la liga.
- Hora de inicio de las jornadas.
- Fecha de inicio de la competición.
  Una vez creada, la aplicación generará automáticamente:
- Un código único de invitación.
- Un enlace de invitación compartible.
  La liga permanecerá en estado Pendiente de inicio hasta que el administrador decida
  comenzarla.
  ⸻

2. INCORPORACIÓN DE JUGADORES
   Los usuarios podrán unirse libremente a la liga mediante:

- Código de invitación.
- Enlace de invitación.
  No existirá un límite predefinido de participantes.
  Los jugadores podrán seguir incorporándose mientras la liga permanezca en estado Pendiente
  de inicio.
  Al unirse a una liga, cada participante deberá configurar:
- Nombre de equipo.
- Imagen o escudo de equipo.
  Estos datos aparecerán en:
- Clasificación.
- Calendario.
- Resultados.
- Estadísticas.
- Perfil del equipo.
  ⸻

3. INICIO DE LA LIGA
   El creador de la liga será el administrador de la competición.
   Mientras la liga esté pendiente de inicio, el administrador podrá visualizar todos los equipos
   inscritos.
   Cuando considere que están todos los participantes necesarios, podrá pulsar el botón
   Comenzar Liga.
   Al pulsar este botón:

- Se cerrarán automáticamente las inscripciones.
- No podrán incorporarse nuevos equipos.
- Se generará automáticamente el calendario completo.
- Se crearán todas las jornadas necesarias.
- La liga pasará al estado Activa.
  ⸻

4. GENERACIÓN DEL CALENDARIO
   La aplicación deberá generar automáticamente el calendario completo una vez iniciada la liga.
   Todos los equipos deberán enfrentarse entre sí.
   La generación de jornadas deberá adaptarse automáticamente al número de participantes
   inscritos.
   Si el número de participantes es impar:

- En cada jornada descansará un equipo.
- El descanso irá rotando automáticamente entre todos los participantes.
  ⸻

5. SISTEMA DE JORNADAS
   La competición estará organizada por jornadas.
   Cada jornada tendrá:

- Fecha de inicio.
- Hora de inicio.
- Duración fija de 24 horas.
  Ejemplos:
- Inicio a las 10:00 → cierre a las 10:00 del día siguiente.
- Inicio a las 15:00 → cierre a las 15:00 del día siguiente.
- Inicio a las 21:00 → cierre a las 21:00 del día siguiente.
  Cuando una jornada se active:
- Los partidos correspondientes quedarán habilitados automáticamente.
- Los jugadores recibirán una notificación.
  Al finalizar las 24 horas:
- La jornada se cerrará automáticamente.
- No se podrán realizar más intentos.
- Se actualizarán resultados y clasificación.
- Se habilitará la siguiente jornada.
  ⸻

6. FORMATO DE LOS PARTIDOS
   Los partidos serán asíncronos.
   No será necesario que ambos jugadores estén conectados simultáneamente.
   Cada participante podrá jugar su partido en cualquier momento dentro de las 24 horas
   disponibles.
   Ejemplo:

- Jugador A juega a las 17:00.
- Jugador B juega a las 20:00.
  El sistema almacenará los resultados de ambos y determinará automáticamente el ganador.
  ⸻

7. SISTEMA DE INTENTOS
   Cada jugador dispondrá inicialmente de:

- 2 intentos gratuitos por jornada.
  Además podrá obtener:
- 1 intento adicional mediante la visualización de un anuncio recompensado.
  Por tanto, cada jugador dispondrá de hasta 3 intentos sin coste económico directo.
  Cada intento consistirá en una partida completa de 1 minuto.
  Intentos adicionales de pago
  La aplicación deberá permitir la compra de paquetes de intentos adicionales durante una
  jornada activa.
  Configuración inicial propuesta:
- 2 intentos adicionales por 1 €.
  Estos intentos se añadirán automáticamente a los intentos disponibles del jugador para esa
  jornada.
  Ejemplo:
- 2 intentos gratuitos.
- 1 intento mediante anuncio.
- Compra de 2 intentos extra por 1 €.
  Total disponible para esa jornada: 5 intentos.
  Resultado oficial
  El sistema conservará siempre la mejor puntuación obtenida por el jugador durante la jornada.
  Cada nuevo intento podrá mejorar la puntuación anterior, pero nunca la empeorará.
  Configuración futura
  Los precios y cantidades de intentos deberán quedar parametrizados para poder modificarlos
  en futuras versiones sin necesidad de cambios en el código.
  ⸻

8. RESULTADO OFICIAL DEL PARTIDO
   Cuando ambos jugadores hayan completado sus intentos o haya finalizado la jornada, se
   compararán sus mejores resultados.
   El resultado oficial del partido será el mejor registro conseguido por cada jugador durante la
   jornada.
   ⸻
9. DETERMINACIÓN DEL RESULTADO
   Si un jugador obtiene más goles que su rival:

- Gana el partido.
  Si ambos obtienen la misma cantidad de goles:
- El partido finaliza en empate.
  ⸻

10. SISTEMA DE PUNTOS
    La clasificación seguirá el sistema tradicional del fútbol.

- Victoria = 3 puntos.
- Empate = 1 punto.
- Derrota = 0 puntos.
  ⸻

11. GESTIÓN DE INACTIVIDAD
    Un jugador no participa
    Si un jugador no realiza ningún intento durante la jornada:

- Pierde automáticamente el partido.
- Se registra un resultado de 0-3.
- El rival obtiene una victoria automática.
- El rival recibe 3 puntos.
  Ninguno de los jugadores participa
  Si ninguno de los dos jugadores realiza intentos durante la jornada:
- Ambos recibirán una derrota por 0-3.
- Ninguno obtendrá puntos.
  ⸻

12. CLASIFICACIÓN
    La liga deberá mostrar una clasificación actualizada automáticamente tras cada jornada.
    Cada equipo deberá mostrar:

- Posición.
- Nombre del equipo.
- Escudo o imagen de equipo.
- Partidos jugados.
- Victorias.
- Empates.
- Derrotas.
- Goles a favor.
- Goles en contra.
- Diferencia de goles.
- Puntos.
  ⸻

13. CRITERIOS DE DESEMPATE
    Si dos o más equipos finalizan la temporada con los mismos puntos, la clasificación se
    resolverá en el siguiente orden:
1. Golaveraje particular
   Resultado de los enfrentamientos directos entre los equipos empatados.
1. Golaveraje general
   Diferencia entre goles a favor y goles en contra durante toda la temporada.
   ⸻
1. PREVISUALIZACIÓN DE LA SIGUIENTE JORNADA
   Una vez que un jugador haya finalizado su participación en la jornada actual, la aplicación
   deberá mostrar automáticamente información sobre su siguiente partido.
   La información mostrada deberá incluir:

- Rival de la siguiente jornada.
- Escudo o imagen del rival.
- Número de la siguiente jornada.
- Fecha de inicio.
- Hora de inicio.
- Cuenta atrás hasta el inicio de la próxima jornada.
  Los usuarios también podrán consultar en cualquier momento:
- Jornada actual.
- Próxima jornada.
- Calendario completo de la temporada.
- Resultados de jornadas anteriores.
  ⸻

15. VISIBILIDAD DE RESULTADOS EN TIEMPO REAL
    Durante el periodo activo de una jornada, los resultados obtenidos por cada jugador deberán
    ser visibles para su rival de forma inmediata.
    Cada vez que un jugador complete un intento, la aplicación actualizará automáticamente la
    información del partido.
    Información visible durante el partido
    Cada participante podrá consultar en todo momento:

- Mejor resultado actual del rival.
- Número de intentos utilizados por el rival.
- Hora del último intento realizado por el rival.
- Resultado provisional del enfrentamiento.
  Historial de intentos
  Cada partido deberá almacenar y mostrar el historial completo de intentos realizados por
  ambos jugadores.
  Para cada intento se mostrará:
- Número de intento.
- Hora de realización.
- Goles obtenidos.
  Consulta permanente
  Una vez finalizada la jornada, estos datos no desaparecerán.
  Los resultados y el historial de cada partido deberán permanecer almacenados
  permanentemente.
  ⸻

16. SEGUIMIENTO GLOBAL DE LA JORNADA
    La aplicación deberá incluir una sección denominada “Jornada en Directo” accesible para todos
    los participantes de la liga.
    Esta sección permitirá consultar en tiempo real todos los partidos de la jornada actual.
    Información mostrada por partido

- Nombre de ambos equipos.
- Escudo de ambos equipos.
- Mejor resultado actual de cada jugador.
- Resultado provisional.
- Número de intentos utilizados por cada jugador.
- Estado del partido.
  Estados posibles
- Pendiente.
- En juego.
- Finalizado.
- Victoria automática por incomparecencia.
  Clasificación provisional
  Durante la jornada podrá mostrarse una clasificación provisional basada en los resultados que
  se estén produciendo en tiempo real.
  La clasificación oficial únicamente se actualizará al cierre de la jornada.
  Actividad de la jornada
  La aplicación podrá incluir un feed de actividad en tiempo real con eventos como:
- FC Pablo acaba de marcar 12 goles.
- FC Ernesto supera a FC Pablo.
- FC Carlos ha utilizado un intento adicional.
- FC Álvaro ha finalizado su participación.
  ⸻

17. FINALIZACIÓN DE LA TEMPORADA
    La temporada finalizará automáticamente cuando se hayan disputado todas las jornadas
    programadas.
    Al finalizar:

- Se bloqueará la competición.
- Se mostrará la clasificación definitiva.
- Se proclamará campeón al equipo situado en la primera posición.
- Se conservará el historial completo de la temporada.
  ⸻

18. OPCIONES DE MONETIZACIÓN
    18.1 Anuncio recompensado
    Cada jugador podrá obtener 1 intento adicional por jornada viendo un anuncio.
    18.2 Compra de intentos adicionales
    Configuración inicial:

- 2 intentos adicionales por 1 €.
  Los precios deberán ser configurables desde administración.
  18.3 Suscripción Premium
  Posible suscripción mensual con ventajas como:
- Eliminación de anuncios.
- Intentos adicionales incluidos.
- Estadísticas avanzadas.
- Insignia Premium.
- Personalización exclusiva.
  18.4 Personalización de equipos
  Elementos cosméticos:
- Campos exclusivos.
- Marcos de perfil.
- Balones especiales.
- Temas visuales.
  Estas opciones no otorgarán ventajas competitivas.
  18.5 Ligas Premium en futuras versiones
  Posibilidad de crear ligas con funcionalidades avanzadas:
- Personalización de la competición.
- Estadísticas ampliadas.
- Historial avanzado.
  18.6 Moneda virtual en futuras versiones
  Sistema de moneda interna para:
- Personalización.
- Eventos especiales.
- Desbloqueo de contenido.
  18.7 Competiciones especiales en futuras versiones
  Posibilidad futura de implementar:
- Copas eliminatorias.
- Torneos especiales.
- Liga de campeones entre ligas.
- Eventos temporales.
  ⸻
  RESUMEN
- Ligas privadas mediante código o enlace.
- Inscripciones abiertas hasta que el administrador pulse Comenzar Liga.
- Equipos personalizados con nombre y escudo.
- Jornadas de 24 horas.
- Partidos asíncronos.
- Resultados visibles en tiempo real.
- Seguimiento de toda la jornada en directo.
- Historial permanente de partidos e intentos.
- 2 intentos gratuitos + 1 mediante anuncio.
- Compra de intentos adicionales (2 por 1 € inicialmente).
- Clasificación y criterios de desempate automáticos.
- Calendario completo visible.
- Monetización escalable para futuras versiones.
