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

$(function() {
    chrome.tabs.query({'active': true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {"testDBSearch": true}, function(response) {
            // console.log("Getting Here.");
            // console.log(response);
            if (response) {
                $('#runSearch').prop('disabled', false);
            } else {
                $('#runSearch').prop('disabled', true);
            }
        });
    });
    $("#tryAgain").click(function() {
        $("#retryContainer").hide();
        getSearchDB();
    });
    $('#runSearch').click(function() {
        chrome.tabs.query({'active': true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {"runDBSearch": true}, function(response) {
                $tables = response.data.criteriaTables;
                $tablesCount = $tables.length;
                delete response.data.criteriaTables;
                $data = getAJAXCode(response.data);
                $data += "&ajax_request=true&criteriaTables[]=";
                $url = response.url;
                $("#runSearchContainer").hide();
                $("#tableContainer").show();
                $("#progressBarContainer .progress-bar").attr('aria-valuemax', $tablesCount);
                $("#progressBarContainer").show();
                getSearchDB();
                // console.log(response);
            });
        });
    });
    $('#search_results').on('click', 'a', function(event) {event.preventDefault();});
});

// console.log("popup.js Loaded");