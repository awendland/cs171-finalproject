// Courtesy of https://codepen.io/thecraftycoderpdx/pen/rJYNRv?editors=0010#0

queue()
    .defer(d3.json,"data/totalsunburst.json")
    .await(createVis);

function createVis(error, data){
    if(error) { console.log(error); };

    // set width, height, and radius
    var width = 450,
        height = 450,
        radius = (Math.min(width, height) / 2) - 10; // lowest number divided by 2. Then subtract 10

    var formatNumber = d3.format(",d"); // formats floats

    var x = d3.scaleLinear() // continuous scale. preserves proportional differences
        .range([0, 2 * Math.PI]); // setting range from 0 to 2 * circumference of a circle

    var y = d3.scaleSqrt() // continuous power scale
        .range([0, radius]); // setting range from 0 to radius

    var partition = d3.partition(); // subdivides layers

    // define arcs
    var arc = d3.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

    // prep the data
    var root = d3.hierarchy(data);

    // calculate total
    var total = 0

    // must call sum on the hierarchy first
    // and as we're doing that, total up the sum of the chart
    root.sum(function(d) {
        if (d.size) {
            total += d.size
        }
        return d.size;
    });

    // enable data as true true
    root.data.children.forEach(function(d){
        d.enabled = true;
    })

    // define SVG element
    var element = d3.select("#sunburst").append("svg")
        .attr("width", width) // set width
        .attr("height", height) // set height

    var defs = element.append("defs") // add pattern
        .append("pattern")
        .attr("id", "diagonal-stripe")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 6)
        .attr("height", 6)
        .append("path")
        .attr("d", "M 0 0 L 0 10")
        .attr('stroke-width', 2)
        .attr("stroke", "black");

    var svg = element.append("g") // append g element
        .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

    var tooltip = d3.tip()
        .attr("class", "d3-tip")
        .html(function (d) {
            if (d.parent.depth == 2) {
                return d.data.name + ", " + d.parent.data.name + ", " + d.parent.parent.data.name + ", " + d.value;
            }
            if (d.parent.depth == 1) {
                return d.data.name + ", " + d.parent.data.name + ", " + d.value;
            }
            else {
                return d.data.name +  ", " + d.value;
            }
        });

    svg.call(tooltip);

    var path = svg.selectAll("path")
        .data(partition(root).descendants()) // path for each descendant
        .enter().append("path")
        .attr("d", arc) // draw arcs
        .attr("class", "path")
        .style("fill",function(d) {
            return (d.children ? d : d.parent).data.color;
        })
        .style("stroke", "white")
        .style("stroke-width", 0.5)
        .on("click", click)
        .on('mouseover', tooltip.show)
        .on('mouseout', tooltip.hide);

    var path2 = svg.selectAll("#path2")
        .data(partition(root).descendants()) // path for each descendant
        .enter().append("path")
        .attr("d", arc) // draw arcs
        .attr("class", "path2")
        .style("fill",function(d) {
            if (d.data.name == "Female") {
                return "url(#diagonal-stripe)";
            }
            else if (d.depth == 3 && d.parent.data.name == "Female") {
                return "url(#diagonal-stripe)";
            }
            else {
                return "none";
            }
        })
        .style("stroke", "white")
        .style("stroke-width", 0.5)
        .on("click", click)
        .on('mouseover', tooltip.show)
        .on('mouseout', tooltip.hide);

    d3.select(self.frameElement).style("height", height + "px");

    svg.append("text")
        .attr("class", "total")
        .attr("text-anchor", "middle")
        .attr('font-size', '4em')
        .attr('y', 20)
        .text(total)
        .on("click", click);

    // zoom on click
    function click(d) {
        svg.transition()
            .duration(750) // duration of transition
            .tween("scale", function() {
                var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(y.domain(), [d.y0, 1]),
                    yr = d3.interpolate(y.range(), [d.y0 ? (80) : 0, radius]);
                return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
            })
            .selectAll("path")
            //.selectAll("path2")
            .attrTween("d", function(d) { return function() { return arc(d); }; });
        d3.select(".total").text(d.value);
    }

    // Legend
    var svgContainer = d3.select("#legend2").append("svg")
        .attr("width", 300)
        .attr("height", 50);

    var female = svgContainer.append("rect")
        .attr("x", 10)
        .attr("y", 15)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill","url(#diagonal-stripe)")
        .attr('stroke-width', 0.5)
        .attr("stroke", "black");

    var male = svgContainer.append("rect")
        .attr("x", 150)
        .attr("y", 15)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill","white")
        .attr('stroke-width', 0.5)
        .attr("stroke", "black");

    var femaleText = svgContainer.append("text")
        .attr("x", 35)
        .attr("y", 25)
        .text("Female")
        .style("font-size", "15px")
        .attr("alignment-baseline","middle");

    var maleText = svgContainer.append("text")
        .attr("x", 175)
        .attr("y", 25)
        .text("Male")
        .style("font-size", "15px")
        .attr("alignment-baseline","middle");

    var concentrations = d3.select("#concentrations").append("svg")
        .attr("width", 500) // set width
        .attr("height", 400); // set height

    var data = partition(root).descendants();
    var concentrationData = [];

    data.forEach(function (d) {
        if (d.depth == 1) {
            concentrationData.push({Concentration: d.data.name, Color: d.data.color});
        }
    });

    var data = partition(root).descendants();
    var result = data.filter(function(d) {
        return d.depth != 0;
    });

    var boxes = concentrations.selectAll("boxes")
        .data(concentrationData)
        .enter()
        .append("rect")
        .attr("x", 10)
        .attr("y", function (d, i) {
            return 30 * i;
        })
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill",function(d) {
            return d.Color;
        })
        .attr('stroke-width', 0.5)
        .attr("stroke", "black")
        .data(result)
        .on("click", zoom);

    // zoom on click
    function zoom(d) {
        svg.transition()
            .duration(750) // duration of transition
            .tween("scale", function() {
                var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(y.domain(), [d.y0, 1]),
                    yr = d3.interpolate(y.range(), [d.y0 ? (80) : 0, radius]);
                return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
            })
            .selectAll("path")
            .attrTween("d", function(d) { return function() { console.log(d); return arc(d); }; });

        d3.select(".total").text(d.value);
    }

    var text = concentrations.selectAll("label")
        .data(concentrationData)
        .enter()
        .append("text")
        .attr("x", 35)
        .attr("y", function (d, i) {
            return 30 * i + 10;
        })
        .text(function (d) {
            return d.Concentration;
        })
        .style("font-size", "15px")
        .attr("alignment-baseline","middle");
};


