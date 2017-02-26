/* eslint-env browser, jquery */

/* exported callAPI */
/* exported restart */
/* exported listenForRestartFinished */

function callAPI(call) {
    $.getJSON(call)
    .done(function(result) {
        alert("Created backup file: " + result.path);
    })
    .fail(function(err) {
        alert("Error creating backup file: " + err);
    });
}

function restart() {
    $.post('/api/restart', function() {})
    .done(function() {
        $('#restartProgressModal').modal('show');
        listenForRestartFinished();
    })
    .fail(function(err) {
        alert("The restart failed. " + err.responseJSON.error)
    });
}

function listenForRestartFinished() {
    var eventSource = new EventSource('http://127.0.0.1:8765/api/restart');
    eventSource.addEventListener('message', function(e) {
        var result = JSON.parse(e.data);

        if (result.restarted) {
            $('#restartProgressModal').modal('hide');
            eventSource.close();
            window.location.reload(true);
        }
    }, false);
}
