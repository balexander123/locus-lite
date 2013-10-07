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
 describe('app', function() {
    describe('initialize', function() {
        it('should bind deviceready', function() {
            runs(function() {
                spyOn(app, 'onDeviceReady');
                app.initialize();
                helper.trigger(window.document, 'deviceready');
            });

            waitsFor(function() {
                return (app.onDeviceReady.calls.length > 0);
            }, 'onDeviceReady should be called once', 500);

            runs(function() {
                expect(app.onDeviceReady).toHaveBeenCalled();
            });
        });
    });

    describe('onDeviceReady', function() {
        it('should report that it fired', function() {
            spyOn(app, 'receivedEvent');
            app.onDeviceReady();
            expect(app.receivedEvent).toHaveBeenCalledWith('deviceready');
        });
    });
});


describe('database', function() {

    describe('configuration', function() {

        it('should know the database configuration', function() {
            expect(appDbName).toEqual('locations');
        });

        it('should know the remote sync URL', function() {
            expect(REMOTE_SYNC_URL).toEqual('http://sync.couchbasecloud.com:4984/locations');
        });
    });

    describe('connection', function() {

        it('should have a coax connection', function() {
            expect(coax).not.toEqual(null);
        });
    });
});


describe('location', function() {
    var position ;
    var fake_coords;

    beforeEach(function() {
        fake_coords = {
            latitude: 37.791269,
            longitude: -122.390978,
            timestamp: new Date().getTime()
        };
        position = {
            coords: fake_coords
        }
    });

    describe('device location', function() {
        it('should know the location of the device', function() {
            expect(deviceLocation).not.toEqual(null);
            var callback = spyOn(deviceLocation, 'setCurrentLocation').andCallThrough();
            spyOn(navigator.geolocation, 'getCurrentPosition').andCallFake(function() {
                deviceLocation.setCurrentLocation(position);
            })
            deviceLocation.getCurrentPosition();
            expect(callback).toHaveBeenCalled();
            expect(deviceLocation.latitude).toEqual(37.791269);
            expect(deviceLocation.longitude).toEqual(-122.390978);
        });
    });

    describe('user location', function() {
        it('should know the nearest Gap campus of user', function() {
            expect('pending').toEqual('completed');
        });
    });
    
});
