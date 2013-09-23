/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var coax = require("coax"),
    appDbName = "locations"

// var REMOTE_SYNC_URL = "http://10.0.1.12:4984/todos/"
var REMOTE_SYNC_URL = "http://sync.couchbasecloud.com:4984/locations"

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.configDatabase();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    // Configure the database
    configDatabase: function() {
        setupConfig(function(){
        connectToChanges()
        goIndex()
        triggerSync(function(err) {
            if (err) {console.log("error on sync"+ JSON.stringify(err))}
        })
    })
    }
};

function registerFacebookToken(cb) {
    var registerData = {
        remote_url : config.site.syncUrl,
        email : config.user.email,
        access_token : config.user.access_token
    }
    log("registerFacebookToken POST "+JSON.stringify(registerData))
    coax.post([config.server, "_facebook_token"], registerData, cb)
}

function setupConfig(done) {
    // get CBL url
    if (!window.cblite) {
        return done('Couchbase Lite not installed')
    }

    cblite.getURL(function(err, url) {
        if (err) {return done(err)}
        var db = coax([url, appDbName]);
        setupDb(db, function(err, info){
            if (err) {return done(err)}
            setupViews(db, function(err, views){
                if (err) {return done(err)}
                getUser(db, function(err, user) {
                    if (err) {return done(err)}
                    window.config = {
                        site : {
                            syncUrl : REMOTE_SYNC_URL
                        },
                        user : user,
                        setUser : function(newUser, cb) {
                            if (window.config.user) {
                                if (config.user.user_id !== newUser.email) {
                                    return cb("already logged in as "+config.user.user_id)
                                } else {
                                    // we got a new facebook token
                                    config.user.access_token = newUser.access_token
                                    db.put("_local/user", config.user, function(err, ok){
                                        if (err) {return cb(err)}
                                        log("updateUser ok")
                                        config.user._rev = ok.rev
                                        cb()
                                    })
                                }
                            } else {
                                newUser.user_id = newUser.email
                                log("setUser "+JSON.stringify(newUser))
                                db.put("_local/user", newUser, function(err, ok){
                                    if (err) {return cb(err)}
                                    log("setUser ok")
                                    window.config.user = newUser
                                    cb()
                                })
                            }
                        },
                        db : db,
                        s : coax(url),
                        info : info,
                        views : views,
                        server : url,
                        t : t
                    }
                    if (window.config.user) {
                        registerFacebookToken(done)
                    } else {
                        done(false)
                    }
                })
            })
        })
    })

    function setupDb(db, cb) {
        // db.del(function(){
            db.put(function(){
                db.get(cb)
            })
        // })
    }

    function setupViews(db, cb) {
        var design = "_design/todo9"
        db.put(design, {
            views : {
                lists : {
                    map : function(doc) {
                        if (doc.type == "list" && doc.created_at && doc.title) {
                            emit(doc.created_at, doc.title)
                        }
                    }.toString()
                },
                tasks : {
                    map : function(doc) {
                        if (doc.type == "task" && doc.created_at && doc.title && doc.list_id) {
                            emit([doc.list_id, doc.created_at],
                                {
                                    checked : doc.checked ? "checked" : "",
                                    title : doc.title,
                                    image : (doc._attachments && doc._attachments["image.jpg"])
                                })
                        }
                    }.toString()
                },
                profiles : {
                    map : function(doc){
                        if (doc.type == "profile" && doc.user_id && doc.name) {
                            emit(doc.name)
                        }
                    }.toString()
                }
            }
        }, function(){
            cb(false, db([design, "_view"]))
        })
    }

    function getUser(db, cb) {
        db.get("_local/user", function(err, doc) {
            var user = false;
            if (!err) {
                user = doc;
            }
            cb(false, user)
        })
    };
}

