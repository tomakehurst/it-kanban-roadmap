var RoadMap = {};

RoadMap.create = function(programme, startDateAsString, endDateAsString) {
	
	function range(start, end) {
		return _.extend(_.range(start, end), {
			each: function(fn) {
				_.each(this, fn);
			}
		});
	}
	
	function circleLabel(initiative, currentDate) {
		var expectedInPast = moment(initiative.expected).diff(moment(currentDate), 'days') >= 0;
		if (expectedInPast) {
			return "Done";
		} else if (!expectedInPast && initiative.commitment) {
			return "Committed";
		} else {
			return "Forecast";
		}
	}
	
	function half(value) {
		return value / 2;
	}
	
	function drawFunctionFor(roadMap) {
		return function(p) {
			var width = 1500;
			var height = 1000;
			var leftMargin = 200;
			var rightMargin = 50;
			var rightBound = width - rightMargin;
			var topMargin = 50;
			var bottomMargin = 50;
			var bottomBound = height - bottomMargin;
			
			var numMonths = roadMap.numberOfMonths();
			var lineSpacing = (rightBound - leftMargin) / numMonths;
			
			var programmeBoxLeftMargin = 10;
			var programmeBoxTopMargin = topMargin + 50;
			var programmeBoxMidX = programmeBoxLeftMargin + ((leftMargin - programmeBoxLeftMargin) / 2);
			var totalProgrammeHeight = bottomBound - programmeBoxTopMargin;
			var totalProgrammeWidth = rightBound - leftMargin;
			
			var workstreamsLineSpacing = (bottomBound - programmeBoxTopMargin) / _.size(roadMap.workstreams);
			
			var boxSize = 50;
			var circleSize = boxSize * 0.8;
			
			p.background(250);
			p.size(width, height);
			p.strokeWeight(2);
			p.textFont(p.loadFont('arial'), 16);
			p.fill(0);
			p.stroke(200);
			p.line(leftMargin, topMargin, rightBound, topMargin);
			p.line(leftMargin, bottomBound, rightBound, bottomBound);
			
			//Vertical lines
			for (var i = 0; i <= numMonths + 1; i++) {
				var x = leftMargin + (i * lineSpacing);
				p.line(x, topMargin, x, bottomBound);
			};
			
			//Month names
			for (i = 0; i < numMonths; i++) {
				var x = leftMargin + 10 + (i * lineSpacing);
				var start = roadMap.startDate.clone();
				var month = start.add('months', i).format('MMM');
				p.text(month, x, topMargin + 30);
			};
			
			p.stroke(0);
			
			//Calculate each workstream's share of total height
			var totalInitiatives = _.reduce(roadMap.workstreams, function(memo, workstream, workstreamName) {
				return memo + workstream.length;
			}, 0);
			var workstreamSpacings = _.reduce(roadMap.workstreams, function(memo, workstream, workstreamName) {
				var height = (workstream.length / totalInitiatives) * totalProgrammeHeight;
				memo[workstreamName] = height;
				return memo;
			}, {});

			//Work stream boxes
			var y = programmeBoxTopMargin;
			_.each(roadMap.workstreams, function(workstream, workstreamName) {
				y = workstreamSpacings[workstreamName] + y;
				p.line(programmeBoxMidX, y, rightBound, y);
			});
			
			//Programme box
			p.strokeWeight(3);
			p.stroke(0);
			p.noFill();
			p.rect(programmeBoxLeftMargin, programmeBoxTopMargin, rightBound - programmeBoxLeftMargin, bottomBound - programmeBoxTopMargin);
			p.line(programmeBoxMidX, programmeBoxTopMargin, programmeBoxMidX, bottomBound);
			p.line(leftMargin, programmeBoxTopMargin, leftMargin, bottomBound);
			
			p.rotate(p.radians(90));
			p.text(programme, programmeBoxLeftMargin + 300, -20);
			
			//Workstream labels
			var textY = programmeBoxTopMargin + 20;
			_.each(roadMap.workstreams, function(workstream, workstreamName) {
				p.text(workstreamName, textY, -(programmeBoxMidX + 10));
				textY = textY + workstreamSpacings[workstreamName];
			});
			p.rotate(p.radians(-90));
			
			//Current date
			
			//Funding horizon
			
			//Boxes and dots
			var initiativeSpacing = totalProgrammeHeight / totalInitiatives;
			var i = 0;
			_.each(roadMap.workstreams, function(workstream, workstreamName) {
				_.each(workstream, function(initiative) {
					
					//Box
					p.strokeWeight(2);
					p.stroke(0);
					p.fill(194, 212, 174);
					var x = leftMargin + (roadMap.proportionOfRange(initiative.desired) * (totalProgrammeWidth));
				    var y = programmeBoxTopMargin + 30 + (i * initiativeSpacing);
					p.rect(x, y, 50, 50);
					
					//Circle inside box
					p.fill(255);
					p.strokeWeight(1);
					if (initiative.desired !== initiative.expected) {
						p.ellipse(x + half(boxSize), y + half(boxSize), circleSize, circleSize);
					}
					
					//Commitment or forecast circle
					if (initiative.commitment) {
						p.fill(87, 205, 135);
					} else {
						p.fill(255, 155, 88);
					}
					x = leftMargin + (roadMap.proportionOfRange(initiative.expected) * (totalProgrammeWidth));
					p.ellipse(x + half(boxSize), y + half(boxSize), circleSize, circleSize);
					
					//Commitment/forecast/done label
					p.fill(0);
					p.textFont(p.loadFont('arial'), 9);
					p.text(circleLabel(initiative, '2012-07-01'), x + 7, y + 25);
					
					//Desired -> expected arrow
					if (initiative.desired !== initiative.expected) {
						p.stroke(87, 205, 135);
					}
					
					i++;
					
				});
			});
		}
	}
	
	return {
		startDate: moment(startDateAsString),
		endDate: moment(endDateAsString),
		
		numberOfMonths: function() {
			return this.endDate.diff(this.startDate, 'months');
		},
		
		proportionOfRange: function(dateAsString) {
			var totalDaysInRange = this.endDate.diff(this.startDate, 'days');
			var days = moment(dateAsString).diff(this.startDate, 'days');
			return days / totalDaysInRange;
		},
		
		programme: programme,
		workstreams: [],
		
		drawIn: function(canvas) {
			var p = new Processing(canvas, drawFunctionFor(this));
			p.exit();
		}
	};
};

var thisRoadMap = RoadMap.create('Test Roadmap', '2012-01-01', '2012-12-31');
thisRoadMap.workstreams = {
	"In browser": [{
		name: "Basic grid",
		desired: '2012-01-15',
		expected: "2012-02-14",
		commitment: false
	},
	{
		name: "Programme and workstreams boxes",
		desired: '2012-04-29',
		expected: "2012-04-05",
		commitment: true
	},
	{
		name: "Dots and boxes",
		desired: '2012-07-29',
		expected: "2012-07-29",
		commitment: false
	}],
	
	"Server components": [{
		name: "RESTful persistence API",
		desired: '2012-09-15',
		expected: "2012-10-15",
		commitment: true
	}],
	
	"Screen paint": [{
		name: "Nice colours",
		desired: '2012-11-31',
		expected: "2012-11-27",
		commitment: true
	}]
};


var canvas = document.getElementById("graphics");
thisRoadMap.drawIn(canvas);



var grid;
var columns = [
  {id: "name", name: "Business Initiative", field: "name"},
  {id: "expected", name: "Expected", field: "expected"},
  {id: "commitment", name: "Commitment?", field: "commitment"}
];

var options = {
  enableCellNavigation: true,
  enableColumnReorder: false
};

$(function () {
  var data = [{
      name: "Do the things",
      expected: "01/01/2012",
      commitment: false
    }];
  grid = new Slick.Grid("#dataGrid", data, columns, options);
})