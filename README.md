
## AmLight’s SDN Looking Glass
Central point for SDN troubleshooting:

Centralizes all monitoring and troubleshooting information being slice/app-independent
Stores all statistical data (flow, ports, etc.) and OpenFlow messages into a persistent backend
Tracks real time OpenFlow control plane messages
Tracks non-OpenFlow information (for instance, CPU utilization)
Supports active and passive topology discovery (LLDP or input file)


## Features


### Topology

The SDN topology shows the current devices topology in the format of a graph.

This panel has the basic navigation where the user can pan the visual field with click and drag
in any part of the empty area.
The nodes can be repositioned with click and drag to better suit the visualization.
Use the mouse wheels to zoom in/out the topology.

The labels of nodes and links can be activate/deactivate in the panel "Edit" session.

Right click over the nodes will open a contextual display, that will trigger action in other panels, if they are available.


### Trace

This panel execute the data plane trance and control plane trace in the same action.
Fill the form with the data to perform the trace and hit "Submit".

The trace path information will be displayed in this same panel.
The path will also be highlighted over the topology, if the panel is available.


### Flows information

This panel will display all the interface flows of a selected device.

The table can be reordered clicking the title.

You can also use the topology contextual menu to trigger the action to select a device.


## Reference
This project used the icons from:
https://thenounproject.com/term/network-topology/1569721/
https://thenounproject.com/search/?q=nodes&i=1509979
https://thenounproject.com/search/?q=table&i=1061423
https://thenounproject.com/search/?q=table&i=662371
https://thenounproject.com/search/?q=table&i=512574



