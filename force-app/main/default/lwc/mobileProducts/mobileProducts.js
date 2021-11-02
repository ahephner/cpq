import { LightningElement, api, track } from 'lwc';

export default class MobileProducts extends LightningElement {
     
    @track prod = [] 
    @api products = []
    loaded = true; 
    connectedCallback(){
        this.load(this.products);
        //this.load(this.prod); 
    }
    
    load(p){
        console.log('in function '+ p)
        let readOnly
        this.prod =  p.map(x=>{
            readOnly = true;

            return {...x, readOnly}
})
    this.products.forEach(x=>{console.log(x);
    })
    }
    edit(e){
        let index = this.products.findIndex(x=>x.Id === e.target.name)
        let one = this.products[index]
        this.prod[index].readOnly = false;
               
    }
}