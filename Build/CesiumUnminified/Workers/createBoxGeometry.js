/**
 * Cesium - https://github.com/CesiumGS/cesium
 *
 * Copyright 2011-2020 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/master/LICENSE.md for full licensing details.
 */

define(['./when-c2e8ef35', './Check-c4f3a3fc', './Math-a06249ed', './Cartesian2-a4e73c05', './Transforms-533d1994', './RuntimeError-6122571f', './WebGLConstants-4ae0db90', './ComponentDatatype-762ab5b7', './GeometryAttribute-47fb6f1a', './GeometryAttributes-57608efc', './GeometryOffsetAttribute-bc682dfe', './VertexFormat-5ae20b72', './BoxGeometry-3351bba0'], function (when, Check, _Math, Cartesian2, Transforms, RuntimeError, WebGLConstants, ComponentDatatype, GeometryAttribute, GeometryAttributes, GeometryOffsetAttribute, VertexFormat, BoxGeometry) { 'use strict';

    function createBoxGeometry(boxGeometry, offset) {
            if (when.defined(offset)) {
                boxGeometry = BoxGeometry.BoxGeometry.unpack(boxGeometry, offset);
            }
            return BoxGeometry.BoxGeometry.createGeometry(boxGeometry);
        }

    return createBoxGeometry;

});
//# sourceMappingURL=createBoxGeometry.js.map
