/*
 * Copyright (c) 2018. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 * Morbi non lorem porttitor neque feugiat blandit. Ut vitae ipsum eget quam lacinia accumsan.
 * Etiam sed turpis ac ipsum condimentum fringilla. Maecenas magna.
 * Proin dapibus sapien vel ante. Aliquam erat volutpat. Pellentesque sagittis ligula eget metus.
 * Vestibulum commodo. Ut rhoncus gravida arcu.
 */
let $tables = [], $tablesCount, $data, $url, $caption = '', $odd = true, $total = 0;

let getAJAXCode = (obj) => {
    let $out = [];
    for (let key in obj) {
        $out.push(key + "=" + obj[key]);
    }
    return $out.join("&");
};

let getSearchDB = () => {
    if($tables.length > 0) {
        let $table = $tables.shift();
        $.post($url, $data + $table, (response) => {
            let $complete = $tablesCount - $tables.length;
            $("#progressBarContainer .progress-bar").css("width", (($complete/$tablesCount)*100) + "%").attr('aria-valuenow', $complete).text($complete + "/" + $tablesCount);
            if (response.success) {
                let $message = $(response.message);
                if ($caption == '') {
                    $caption = $message.find('caption');
                }
                $("#search_results")
                    .append($message
                        .find('tr')
                        .map((index, item) => {
                            $(item).removeClass('odd even').addClass(($odd)?"odd":"even");
                            $odd = !$odd;
                            let $num = /^(\d+)/.exec($(item).text());
                            $total += parseInt($num[1]);
                            if ($num[1] == '0') {
                                $(item).addClass('d-none');
                            }
                            return item;
                        }));
                getSearchDB();
            } else {
                $tables.unshift($table);
                $("#retryContainer").show();
            }
        })
        .fail((response) => {
            $tables.unshift($table);
            $("#retryContainer").show();
        });
    } else {
        $("#progressBarContainer").hide();
        let $result = $('<div>')
            .append($('<br>'))
            .append($('<table>')
                .addClass('data')
                .append($caption)
                .append($('<tbody>')
                    .append($("#search_results")
                        .find('tr')
                        .clone()
                    )
                )
            )
            .append($('<p>')
                .append($('<b>').text('Total:'))
                .append(" ")
                .append($('<i>').text($total))
                .append(($total == 1) ? ' match' : ' matches' )
            );
        chrome.tabs.query({'active': true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {"resultDBSearch": true, "result": $result.html()});
        });
    }
};

chrome.tabs.query({'active': true}, function(tabs) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (sender.id == chrome.runtime.id && message.tab == tabs[0].id) {
            switch (message.action) {
                case "update":
                    $("#content").html(message.message);
                    break;
            }
        }
    });
});


$(function() {
    let $content = $('#content');
    chrome.tabs.query({'active': true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {"testDBSearch": true}, function(response) {
            console.log("Getting Here.");
            console.log(response);
            if (response) {
                $('#runSearch').prop('disabled', false);
            } else {
                $('#runSearch').prop('disabled', true);
            }
        });
        chrome.runtime.sendMessage({"action": "update", "id": tabs[0].id}, (response) => {
            if (response.success) {
                $("#content").html(response.message);
            }
        });
    });
    $content.on('click', '#resetButton', () => {
        chrome.tabs.query({'active': true}, function(tabs) {
            chrome.runtime.sendMessage({"action": "reset", "id": tabs[0].id}, () => {
                window.close();
            });
        });
    });
    $content.on('click', "#tryAgain", function() {
        $("#retryContainer").hide();
        getSearchDB();
    });
    $content.on('click', '#runSearch', function() {
        chrome.tabs.query({'active': true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {"runDBSearch": true}, function(response) {
                $tables = response.data.criteriaTables;
                $tablesCount = $tables.length;
                delete response.data.criteriaTables;
                $data = getAJAXCode(response.data);
                $data += "&ajax_request=true&criteriaTables[]=";
                $url = response.url;
                if ($tablesCount > 0) {
                    chrome.runtime.sendMessage({"action": "start", "tables": $tables, "tables-count": $tablesCount, "data": $data, "url": $url, "odd": true, "total": 0, "tab": tabs[0].id}, () => {
                        $("#runSearchContainer").hide();
                        $("#tableContainer").show();
                        $("#progressBarContainer .progress-bar").attr('aria-valuemax', $tablesCount);
                        $("#progressBarContainer").show();
                    });
                } else {
                    $content.find("#runSearchContainer").prepend($('<div class="alert alert-warning alert-dismissible" role="alert">\n' +
                        '  <strong>Hold on!</strong> You need to select at least one table.\n' +
                        '  <button type="button" class="close" data-dismiss="alert" aria-label="Close">\n' +
                        '    <span aria-hidden="true">&times;</span>\n' +
                        '  </button>\n' +
                        '</div>'));
                }
                // getSearchDB();
                // console.log(response);
            });
        });
    });
    $('#content').on('click', '#search_results a', function(event) {event.preventDefault();});
});

// console.log("popup.js Loaded");