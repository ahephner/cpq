import { LightningElement, api, track } from 'lwc';
import searchProduct from '@salesforce/apex/cpqApex.searchProduct';


export default class MobileSearch extends LightningElement {
    queryTerm;
    cat = 'All';  
    pf = 'All';
    priceBookId = '01s410000077vSKAAY'; 
    @track prod =[]; 
    loaded = false;
    
    connectedCallback(){
        this.loaded = true; 
    }
    //searchTerm
    //!!!!!!!!!!!!!!NEED TO FIX IF STRNG IS EMPTY OR BLANK
    handleKeyUp(evt) {
        const isEnterKey = evt.keyCode === 13;
        if (isEnterKey) {
            this.queryTerm = evt.target.value;
            this.search();
        }
    }
    search(){
        this.loaded = false; 
        searchProduct({searchKey: this.queryTerm, cat: this.cat, family: this.pf, priceBookId:this.priceBookId})
            .then((results)=>{
                let Name;
                let ProductCode
                let icon;
                let title
                this.prod = results.map(x =>{
                    Name = x.Product2.Name,
                    ProductCode = x.Product2.ProductCode
                    icon = 'action:new'
                    title = ''
                    return {...x, Name, ProductCode, icon, title}
                })
                //this.prod = results; 
                //console.log(JSON.stringify(this.prod))
                
            }).catch((error)=>{
                this.error = error;
                console.log('error -->'+error);
            }).finally(()=>{
                    this.loaded = true; 
                    
            })
    }
    //helper function finds selected product and changes button. 
    findProduct(sel){
        let index = this.prod.findIndex(item => item.Id === sel.target.name)
        
        if(this.prod[index].icon==='action:new'){
            this.prod[index].icon = 'action:approval'
            this.prod[index].title = 'added!'
            this.addProduct(this.prod[index]);
        }else{
            this.prod[index].icon = 'action:new'
            this.prod[index].title = ''
            this.removeProduct(this.prod[index])
        }
        return ;
    }
    addProduct(product){
        
        const pd = product
                
        this.dispatchEvent(new CustomEvent('newprod',{
            detail: pd
        }))
    }

    removeProduct(sProd){
        const removeCode = sProd.ProductCode;

        this.dispatchEvent(new CustomEvent('remove',{
            detail: removeCode
        }))
    }
    @api
    showResult(mess){
        console.log('mess ' +mess); 
    }
    handleDone(){
        console.log('dispatch');
        
        this.loaded = false;
        this.dispatchEvent(new CustomEvent('close'));
        
    }

    handleCancel(){
        console.log('cancel');
        
    }
}