/*
 * Copyright (c) 2018. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 * Morbi non lorem porttitor neque feugiat blandit. Ut vitae ipsum eget quam lacinia accumsan.
 * Etiam sed turpis ac ipsum condimentum fringilla. Maecenas magna.
 * Proin dapibus sapien vel ante. Aliquam erat volutpat. Pellentesque sagittis ligula eget metus.
 * Vestibulum commodo. Ut rhoncus gravida arcu.
 */

'use strict';

let getSearchDB = ($id) => {
    let $store = $($id);
    let $tables = $store.data("tables");
    if($tables.length > 0) {
        let $table = $tables.shift();
        $store.data('tables', $tables);
        $.post($store.data("url"), $store.data("data") + $table, (response) => {
            let $tablesCount = $store.data("tablesCount");
            let $complete = $tablesCount - $tables.length;
            $store.find("#progressBarContainer .progress-bar").css("width", (($complete/$tablesCount)*100) + "%").attr('aria-valuenow', $complete).text($complete + "/" + $tablesCount);
            if (response.success) {
                let $message = $(response.message);
                if ($store.data('caption') == '') {
                    $store.data('caption', $message.find('caption'));
                }
                $store.find("#search_results")
                    .append($message
                        .find('tr')
                        .map((index, item) => {
                            let $odd = $store.data('odd');
                            $(item).removeClass('odd even').addClass(($odd)?"odd":"even");
                            $store.data('odd', !$odd);
                            let $num = /^(\d+)/.exec($(item).text());
                            $store.data('total', $store.data('total') + parseInt($num[1]));
                            if ($num[1] == '0') {
                                $(item).addClass('d-none');
                            }
                            return item;
                        }));
                updatePopup($id);
                getSearchDB($id);
            } else {
                $tables.unshift($table);
                $store.data('tables', $tables);
                $store.find("#retryContainer").show();
                updatePopup($id);
            }
        })
            .fail((response) => {
                $tables.unshift($table);
                $store.data('tables', $tables);
                $store.find("#retryContainer").show();
                updatePopup($id);
            });
    } else {
        $store.find("#resetContainer").show();
        $store.find("#progressBarContainer").hide();
        let $result = $('<div>')
            .append($('<br>'))
            .append($('<table>')
                .addClass('data')
                .append($store.data('caption'))
                .append($('<tbody>')
                    .append($store.find("#search_results")
                        .find('tr')
                        .clone()
                    )
                )
            )
            .append($('<p>')
                .append($('<b>').text('Total:'))
                .append(" ")
                .append($('<i>').text($store.data('total')))
                .append(($store.data('total') == 1) ? ' match' : ' matches' )
            );
        updatePopup($id);
        chrome.tabs.sendMessage($store.data('tab'), {"resultDBSearch": true, "result": $result.html()});
    }
};

let updatePopup = ($id, ret = false) => {
    let $store = $($id);
    if ($store) {
        if (ret) {
            return {"success": true, "message": $store.html()};
        }
        chrome.runtime.sendMessage({"action": "update", "message": $store.html(), "tab": $store.data('tab')});
    } else {
        return {"success": false, "message": "Nothing here."};
    }
};

// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        // With a new rule ...
        chrome.declarativeContent.onPageChanged.addRules([
            {
                // That fires when a page's URL contains a 'g' ...
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { urlContains: 'phpmyadmin' },
                    })
                ],
                // And shows the extension's page action.
                actions: [ new chrome.declarativeContent.ShowPageAction() ]
            }
        ]);
    });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id == chrome.runtime.id) {
        switch (message.action) {
            case "start":
                $('body').append(
                    $("<div>")
                        .attr("id", message.tab)
                        .data(message)
                        .append('<div class="container my-5 py-2">\n' +
                            '        <div class="row">\n' +
                            // '            <div id="runSearchContainer" class="col-12 align-items-center">\n' +
                            // '                <button id="runSearch" class="btn btn-success" disabled>Run DB Search one table at a time</button>\n' +
                            // '            </div>\n' +
                            '            <div id="tableContainer" class="col-12">\n' +
                            '                <table class="table table-sm table-hover">\n' +
                            '                    <thead>\n' +
                            '                    <tr>\n' +
                            '                        <th>Result</th>\n' +
                            '                        <th>Browse</th>\n' +
                            '                        <th>Delete</th>\n' +
                            '                    </tr>\n' +
                            '                    </thead>\n' +
                            '                    <tbody id="search_results"></tbody>\n' +
                            '                </table>\n' +
                            '                <div id="resetContainer" class="navbar-brand" style="display: none;">\n' +
                            '                    <button id="resetButton" class="btn btn-info">Reset</button>\n' +
                            '                </div>\n' +
                            '            </div>\n' +
                            '        </div>\n' +
                            '    </div>\n' +
                            '    <nav id="progressBarContainer" class="navbar fixed-bottom navbar-light bg-light">\n' +
                            '        <div class="navbar-text" style="width: 100%;">\n' +
                            '            <div class="progress">\n' +
                            '                <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="1"></div>\n' +
                            '            </div>\n' +
                            '        </div>\n' +
                            '        <div id="retryContainer" class="navbar-brand" style="display: none;">\n' +
                            '            <button id="tryAgain" class="btn btn-warning">Try Again</button>\n' +
                            '        </div>\n' +
                            '    </nav>')
                );
                getSearchDB("#" + message.tab);
                break;
            case "update":
                sendResponse(updatePopup("#" + message.id, true));
                break;
            case "reset":
                $('#' + message.id).remove();
                break;
        }
    }
});